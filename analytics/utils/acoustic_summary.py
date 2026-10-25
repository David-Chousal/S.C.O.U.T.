"""
acoustic_summary.py
-------------------
Reference implementation of the buoy's acoustic summary (ADR-0010, SCO-233).

The buoy cannot send audio over LoRa, so while a recording streams to the SD card it computes a
14-byte summary that rides in the next packet:

    lvl_anthro_cdb i16 | lvl_mixed_cdb i16 | lvl_bio_cdb i16 | lvl_broad_cdb i16 |
    ndsi_e4 i16 | snap_count u16 | clip_count u16

This module is the **specification** of that summary. ``firmware/lib/scout_acoustic`` is a
line-for-line port of it, and the firmware's native tests check the port against golden vectors
this module writes (``python -m utils.acoustic_summary --write-golden``). Every step is integer
arithmetic with explicit widths, so the two agree bit for bit. If you change anything here,
regenerate the golden vectors and update ``firmware/src/config.h`` in the same commit;
``utils/tests/test_acoustic_summary.py`` fails until you do.

Standard library only, so it runs in CI next to the shore tests.

Signal chain, per 12-bit ADC sample ``s`` (0..4095) at 22,050 Hz:

1. Clip counter: ``s`` within ``clip_margin`` counts of either rail (saturating u16).
2. Centre and scale: ``x = (s - 2048) << 3``, so a full-scale swing is ±16,384 and the
   filters have 6 dB of headroom inside int16.
3. DC blocker: one-pole high-pass at about 6.9 Hz (the preamp output sits at mid-rail).
4. Band filters: Butterworth biquads, bilinear transform, Q14 feedback coefficients and a
   separately scaled gain, with first-order error feedback so low-frequency sections do not
   drown in their own rounding noise. Bands are the shore pipeline's bands
   (``acoustic_indices.py``): ANTHRO 0–200 Hz (4th-order low-pass), MIXED 200–1,000 Hz and
   BIO 1,000–8,000 Hz (2nd-order high-pass then 2nd-order low-pass). Broadband is the
   DC-blocked signal itself.
5. Energy: sum of squares per band in an unbounded (firmware: 64-bit) accumulator.
6. Snap detector on the BIO output: a crossing of ``threshold × running mean |bio|`` (and of an
   absolute floor), then a refractory window so one snap counts once (saturating u16).
7. ``finalize``: levels in centi-dB re a full-scale sine (an integer log2, no libm), and
   NDSI = (E_bio − E_anthro) / (E_bio + E_anthro) × 10,000.

Levels are dBFS, i.e. relative, until the analog chain is calibrated (ADR-0010).
"""

from __future__ import annotations

import argparse
import math
import struct
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field
from pathlib import Path

SAMPLE_RATE_HZ = 22050

# Must equal acoustic_indices.py; test_acoustic_summary.py checks it without importing maad.
ANTHRO_BAND = (0, 200)
MIXED_BAND = (200, 1000)
BIO_BAND = (1000, 8000)

INT16_MIN, INT16_MAX = -32768, 32767
UINT16_MAX = 65535

SUMMARY_FORMAT = "<hhhhhHH"  # the 14 bytes appended to the packet body, in ADR-0010 order
SUMMARY_SIZE = struct.calcsize(SUMMARY_FORMAT)

_LOG2_FRAC_BITS = 16
_CDB_PER_LOG2_E6 = 301030  # 1000 × log10(2) × 1000: centi-dB per octave of power, ×1000
_NDSI_SCALE = 10000
_NDSI_HEADROOM = 1 << 48  # energies are halved below this so (Eb − Ea) × 10,000 fits int64


@dataclass(frozen=True)
class Biquad:
    """One second-order section: y = (gain·(x + c1·x1 + x2) − (a1·y1 + a2·y2)·2^(shift−14)) >> shift.

    ``c1`` is +2 for a low-pass and −2 for a high-pass (bilinear Butterworth numerators are
    exactly (1 ± z⁻¹)²). ``a1``/``a2`` are Q14. ``gain`` is scaled by 2^shift, with ``shift``
    picked so ``gain`` keeps 15 significant bits even when it is tiny (the 200 Hz low-pass).
    """

    c1: int
    gain: int
    a1: int
    a2: int
    shift: int


def design_biquad(kind: str, fc_hz: float, q: float, fs_hz: int = SAMPLE_RATE_HZ) -> Biquad:
    """Quantised bilinear Butterworth section. Used to derive the constants, not at run time.

    The gain is computed from the *quantised* feedback coefficients so each section has exactly
    unity gain at DC (low-pass) or Nyquist (high-pass).
    """
    if kind not in ("LP", "HP"):
        raise ValueError(f"kind must be 'LP' or 'HP', got {kind!r}")
    k = math.tan(math.pi * fc_hz / fs_hz)
    norm = 1 / (1 + k / q + k * k)
    a1 = round(2 * (k * k - 1) * norm * 16384)
    a2 = round((1 - k / q + k * k) * norm * 16384)
    if not (INT16_MIN <= a1 <= INT16_MAX and INT16_MIN <= a2 <= INT16_MAX):
        raise ValueError(f"{kind} {fc_hz} Hz: feedback coefficients overflow Q14")
    c1 = 2 if kind == "LP" else -2
    gain = (16384 + c1 // 2 * a1 + a2) / 65536  # (1 ± a1 + a2) / 4 in real terms
    shift = 14
    while gain * (1 << shift) < 16384:
        shift += 1
    return Biquad(c1=c1, gain=round(gain * (1 << shift)), a1=a1, a2=a2, shift=shift)


_BUTTER4_Q = (0.5411961001461970, 1.3065629648763766)  # 4th-order Butterworth section Qs
_BUTTER2_Q = 0.7071067811865476

# Frozen so the run-time path never depends on floating point. test_acoustic_summary.py checks
# that design_biquad() still produces exactly these and that config.h carries the same numbers.
SECTION_DESIGN = (
    ("LP", 200, _BUTTER4_Q[0]),     # anthro, section 1
    ("LP", 200, _BUTTER4_Q[1]),     # anthro, section 2
    ("HP", 200, _BUTTER2_Q),        # mixed, high edge-in
    ("LP", 1000, _BUTTER2_Q),       # mixed, low edge-out
    ("HP", 1000, _BUTTER2_Q),       # bio, high edge-in
    ("LP", 8000, _BUTTER2_Q),       # bio, low edge-out
)
SECTIONS = (
    Biquad(c1=2, gain=26112, a1=-31079, a2=14746, shift=25),
    Biquad(c1=2, gain=26624, a1=-32017, a2=15685, shift=25),
    Biquad(c1=-2, gain=31474, a1=-31448, a2=15115, shift=15),
    Biquad(c1=2, gain=17648, a1=-26232, a2=10951, shift=20),
    Biquad(c1=-2, gain=26784, a1=-26232, a2=10951, shift=15),
    Biquad(c1=2, gain=17601, a1=13880, a2=4938, shift=15),
)


@dataclass(frozen=True)
class AcousticConfig:
    """Every tunable of the summary. Defaults are the decided values (decision log, 2026-10-25).

    Mirrored in ``firmware/src/config.h`` (ACOUSTIC_*), where the reasons are commented.
    """

    adc_bits: int = 12
    input_shift: int = 3            # 12-bit → ±16,384 working units
    dc_pole_shift: int = 9          # pole at 1 − 2⁻⁹: −3 dB at ≈ 6.9 Hz
    dc_frac_bits: int = 8           # extra state precision in the DC blocker
    sections: tuple[Biquad, ...] = SECTIONS
    snap_threshold_q4: int = 128    # 8.0 × running mean |bio|
    snap_min_abs: int = 64          # 8 ADC LSB in working units: ignore quantisation noise
    snap_refractory_samples: int = 66  # 3.0 ms at 22,050 Hz
    snap_floor_shift: int = 12      # floor time constant 2^12 samples ≈ 186 ms
    snap_warmup_samples: int = 2048  # ≈ 93 ms before detection starts
    snap_warmup_shift: int = 7      # faster floor during warm-up
    clip_margin: int = 16           # counts from either rail (0.4% of full scale)

    def __post_init__(self) -> None:
        # Bounds the firmware's 32-bit threshold product (floor_q8 < 2^23, × ≤ 255 < 2^31).
        if not 0 <= self.snap_threshold_q4 <= 255:
            raise ValueError("snap_threshold_q4 must be 0..255")
        if len(self.sections) != 6:
            raise ValueError("the summary has exactly six filter sections")

    @property
    def adc_max(self) -> int:
        return (1 << self.adc_bits) - 1

    @property
    def adc_mid(self) -> int:
        return 1 << (self.adc_bits - 1)

    @property
    def full_scale_power(self) -> int:
        """Mean power of a full-scale sine in working units: the 0 dB reference."""
        amplitude = (self.adc_mid - 1) << self.input_shift
        return amplitude * amplitude // 2


@dataclass(frozen=True)
class AcousticSummary:
    """The seven fields, in ADR-0010 order. All zero means "no recording"."""

    lvl_anthro_cdb: int = 0
    lvl_mixed_cdb: int = 0
    lvl_bio_cdb: int = 0
    lvl_broad_cdb: int = 0
    ndsi_e4: int = 0
    snap_count: int = 0
    clip_count: int = 0

    def to_bytes(self) -> bytes:
        return struct.pack(SUMMARY_FORMAT, *self.as_tuple())

    def as_tuple(self) -> tuple[int, ...]:
        return (self.lvl_anthro_cdb, self.lvl_mixed_cdb, self.lvl_bio_cdb, self.lvl_broad_cdb,
                self.ndsi_e4, self.snap_count, self.clip_count)


def log2_q16(value: int) -> int:
    """floor-ish log2 of a positive integer < 2^64, as Q16 (16 fractional bits).

    Integer part from the bit length; fractional bits by repeated squaring of a Q30 mantissa.
    Deterministic, so the firmware reproduces it exactly without libm.
    """
    if value <= 0:
        raise ValueError("log2 of a non-positive value")
    exponent = value.bit_length() - 1
    mantissa = value << (30 - exponent) if exponent <= 30 else value >> (exponent - 30)
    fraction = 0
    for _ in range(_LOG2_FRAC_BITS):
        mantissa = (mantissa * mantissa) >> 30
        fraction <<= 1
        if mantissa >= 1 << 31:
            mantissa >>= 1
            fraction |= 1
    return (exponent << _LOG2_FRAC_BITS) | fraction


def _div_round(num: int, den: int) -> int:
    """num / den rounded half away from zero (den > 0), as the firmware does it."""
    quotient = (abs(num) + den // 2) // den
    return quotient if num >= 0 else -quotient


def _clamp16(value: int) -> int:
    return INT16_MIN if value < INT16_MIN else INT16_MAX if value > INT16_MAX else value


def level_cdb(energy: int, count: int, full_scale_power: int) -> int:
    """Mean power as centi-dB re a full-scale sine. Digital silence reads −32,768."""
    if count == 0:
        return 0
    if energy == 0:
        return INT16_MIN
    log2_ratio = log2_q16(energy) - log2_q16(count) - log2_q16(full_scale_power)
    return _clamp16(_div_round(log2_ratio * _CDB_PER_LOG2_E6, 1000 << _LOG2_FRAC_BITS))


def ndsi_e4(energy_bio: int, energy_anthro: int) -> int:
    """(E_bio − E_anthro) / (E_bio + E_anthro) × 10,000, rounded; 0 when both are zero."""
    while energy_bio + energy_anthro >= _NDSI_HEADROOM:
        energy_bio >>= 1
        energy_anthro >>= 1
    total = energy_bio + energy_anthro
    if total == 0:
        return 0
    return _div_round((energy_bio - energy_anthro) * _NDSI_SCALE, total)


@dataclass
class _SectionState:
    x1: int = 0
    x2: int = 0
    y1: int = 0
    y2: int = 0
    err: int = 0


def _biquad(x: int, c: Biquad, st: _SectionState) -> int:
    acc = (c.gain * (x + c.c1 * st.x1 + st.x2)
           - (c.a1 * st.y1 + c.a2 * st.y2) * (1 << (c.shift - 14))
           + st.err)
    y = acc >> c.shift
    if y > INT16_MAX:
        y, st.err = INT16_MAX, 0
    elif y < INT16_MIN:
        y, st.err = INT16_MIN, 0
    else:
        st.err = acc & ((1 << c.shift) - 1)
    st.x2, st.x1 = st.x1, x
    st.y2, st.y1 = st.y1, y
    return y


@dataclass
class AcousticSummarizer:
    """Streaming summary of one recording. Mirrors ``ScoutAcoustic`` in the firmware.

    ``feed`` takes blocks of raw ADC counts in any size; ``finalize`` may be called at any time
    and does not change the state.
    """

    config: AcousticConfig = field(default_factory=AcousticConfig)

    def __post_init__(self) -> None:
        self._sections = [_SectionState() for _ in self.config.sections]
        self._started = False
        self._dc_x1 = 0
        self._dc_acc = 0
        self.samples = 0
        self.energy = {"anthro": 0, "mixed": 0, "bio": 0, "broad": 0}
        self.snap_count = 0
        self.clip_count = 0
        self._floor_q8 = 0
        self._refractory = 0
        self._warmup = self.config.snap_warmup_samples

    def feed(self, samples: Iterable[int]) -> None:
        cfg = self.config
        lo_rail, hi_rail = cfg.clip_margin, cfg.adc_max - cfg.clip_margin
        sec, st = cfg.sections, self._sections
        energy = self.energy
        for s in samples:
            s = 0 if s < 0 else cfg.adc_max if s > cfg.adc_max else s  # clamp, as the firmware does
            if (s <= lo_rail or s >= hi_rail) and self.clip_count < UINT16_MAX:
                self.clip_count += 1
            x = (s - cfg.adc_mid) << cfg.input_shift
            if not self._started:  # start the DC blocker at the first sample, not at a step
                self._dc_x1, self._started = x, True
            self._dc_acc += ((x - self._dc_x1) << cfg.dc_frac_bits) - (self._dc_acc >> cfg.dc_pole_shift)
            self._dc_x1 = x
            d = _clamp16(self._dc_acc >> cfg.dc_frac_bits)

            anthro = _biquad(_biquad(d, sec[0], st[0]), sec[1], st[1])
            mixed = _biquad(_biquad(d, sec[2], st[2]), sec[3], st[3])
            bio = _biquad(_biquad(d, sec[4], st[4]), sec[5], st[5])
            energy["broad"] += d * d
            energy["anthro"] += anthro * anthro
            energy["mixed"] += mixed * mixed
            energy["bio"] += bio * bio
            self._snap(abs(bio))
            self.samples += 1

    def _snap(self, magnitude: int) -> None:
        cfg = self.config
        if self._warmup > 0:
            self._floor_q8 += ((magnitude << 8) - self._floor_q8) >> cfg.snap_warmup_shift
            self._warmup -= 1
            return
        if self._refractory > 0:  # the snap's own tail neither counts nor raises the floor
            self._refractory -= 1
            return
        threshold_q12 = max(self._floor_q8 * cfg.snap_threshold_q4, cfg.snap_min_abs << 12)
        if (magnitude << 12) > threshold_q12:
            if self.snap_count < UINT16_MAX:
                self.snap_count += 1
            self._refractory = cfg.snap_refractory_samples
        else:
            self._floor_q8 += ((magnitude << 8) - self._floor_q8) >> cfg.snap_floor_shift

    def finalize(self) -> AcousticSummary:
        if self.samples == 0:
            return AcousticSummary()
        ref, n, e = self.config.full_scale_power, self.samples, self.energy
        return AcousticSummary(
            lvl_anthro_cdb=level_cdb(e["anthro"], n, ref),
            lvl_mixed_cdb=level_cdb(e["mixed"], n, ref),
            lvl_bio_cdb=level_cdb(e["bio"], n, ref),
            lvl_broad_cdb=level_cdb(e["broad"], n, ref),
            ndsi_e4=ndsi_e4(e["bio"], e["anthro"]),
            snap_count=self.snap_count,
            clip_count=self.clip_count,
        )


def summarize(samples: Iterable[int], config: AcousticConfig | None = None) -> AcousticSummary:
    """One-shot summary of a whole recording of raw ADC counts."""
    summarizer = AcousticSummarizer(config or AcousticConfig())
    summarizer.feed(samples)
    return summarizer.finalize()


def quantize_to_adc(signal: Sequence[float], adc_bits: int = 12) -> list[int]:
    """Float samples in [−1, 1) → unsigned ADC counts, as the buoy's mid-rail-biased ADC sees them.

    Used to run recordings through the reference. Rounds half away from zero and clamps.
    """
    mid = 1 << (adc_bits - 1)
    top = (1 << adc_bits) - 1
    out = []
    for v in signal:
        scaled = v * mid
        count = mid + int(scaled + 0.5 if scaled >= 0 else scaled - 0.5)
        out.append(0 if count < 0 else top if count > top else count)
    return out


# ── Golden vectors for the firmware tests ────────────────────────────────────────────────────
#
# Inputs are synthesised by an integer-only generator that the C test reimplements, so the
# header carries a short parameter list per vector instead of thousands of samples. One vector
# is a real 200 ms excerpt of a Sesoko recording and is stored as samples.

SINE_TABLE = tuple(round(32767 * math.sin(2 * math.pi * i / 256)) for i in range(256))

KIND_SILENCE, KIND_TONE, KIND_NOISE, KIND_IMPULSES, KIND_SQUARE = range(5)


def phase_increment(freq_hz: float, fs_hz: int = SAMPLE_RATE_HZ) -> int:
    return round(freq_hz / fs_hz * (1 << 32)) & 0xFFFFFFFF


def synth(kind: int, n: int, p1: int, p2: int, p3: int) -> list[int]:
    """Deterministic 12-bit test signals. Must match synth() in test_acoustic.cpp exactly.

    SILENCE: constant p1. TONE: p1 = phase increment, p2 = amplitude in counts.
    NOISE: p1 = xorshift32 seed, p2 = amplitude. IMPULSES: noise (seed p1, amplitude 4) plus a
    one-sample spike of +p2 counts every p3 samples. SQUARE: rail-to-rail, half-period p1.
    """
    out = []
    phase, state = 0, p1 or 1
    for i in range(n):
        if kind == KIND_SILENCE:
            s = p1
        elif kind == KIND_TONE:
            s = 2048 + ((p2 * SINE_TABLE[phase >> 24]) >> 15)
            phase = (phase + p1) & 0xFFFFFFFF
        elif kind in (KIND_NOISE, KIND_IMPULSES):
            state ^= (state << 13) & 0xFFFFFFFF
            state ^= state >> 17
            state ^= (state << 5) & 0xFFFFFFFF
            amplitude = p2 if kind == KIND_NOISE else 4
            s = 2048 + ((((state >> 20) - 2048) * amplitude) >> 11)
            if kind == KIND_IMPULSES and i % p3 == p3 // 2:
                s += p2
        elif kind == KIND_SQUARE:
            s = 4095 if (i // p1) % 2 == 0 else 0
        else:
            raise ValueError(f"unknown kind {kind}")
        out.append(0 if s < 0 else 4095 if s > 4095 else s)
    return out


GOLDEN_N = 4410  # 200 ms: long enough for the DC blocker and snap warm-up to settle
GOLDEN_SYNTH = (
    # name, kind, p1, p2, p3
    ("silence", KIND_SILENCE, 2048, 0, 0),
    ("tone_anthro_100hz", KIND_TONE, phase_increment(100), 1000, 0),
    ("tone_mixed_500hz", KIND_TONE, phase_increment(500), 1000, 0),
    ("tone_bio_3khz", KIND_TONE, phase_increment(3000), 1000, 0),
    ("noise_white", KIND_NOISE, 12345, 400, 0),
    ("impulses_every_200", KIND_IMPULSES, 777, 1500, 200),
    ("square_full_scale", KIND_SQUARE, 11, 0, 0),
)
_KIND_NAMES = ("SCOUT_SYNTH_SILENCE", "SCOUT_SYNTH_TONE", "SCOUT_SYNTH_NOISE",
               "SCOUT_SYNTH_IMPULSES", "SCOUT_SYNTH_SQUARE")
_REAL_EXCERPT = ("analytics/data/longitudinal/201708_20170801/SSK_Site_A_20170801_000000.wav",
                 132300, 4410)  # path, start sample at 22,050 Hz, length (200 ms)


def load_clip(path: str | Path, start_s: float = 0.0, seconds: float | None = None) -> list[float]:
    """A recording as the buoy would hear it: one channel at 22,050 Hz, floats in [−1, 1).

    Reads the left channel like the shore pipeline (``maad.sound.load``) and resamples with a
    polyphase filter. Note ``maad.sound.load`` ignores the ``sr`` the shore pipeline passes, so
    shore indices are computed at the file's own rate (44.1 kHz for Sesoko); see
    docs/analysis/acoustic-summary-validation.md. Needs numpy, scipy and scikit-maad.
    """
    from math import gcd

    from maad import sound
    from scipy.signal import resample_poly

    signal, rate = sound.load(str(path), channel="left", detrend=True)
    first = int(start_s * rate)
    last = len(signal) if seconds is None else first + int(seconds * rate)
    signal = signal[first:last]
    rate = int(rate)
    if rate != SAMPLE_RATE_HZ:
        common = gcd(rate, SAMPLE_RATE_HZ)
        signal = resample_poly(signal, SAMPLE_RATE_HZ // common, rate // common)
    return [float(v) for v in signal]


def _real_excerpt(repo_root: Path) -> list[int]:
    """200 ms of a real Sesoko recording, at 22,050 Hz and quantised to 12 bits."""
    path, start, length = _REAL_EXCERPT
    clip = load_clip(repo_root / path, start_s=start / SAMPLE_RATE_HZ, seconds=0.25)
    return quantize_to_adc(clip[:length])


def _c_array(values: Sequence[int], per_line: int = 16) -> str:
    rows = [", ".join(str(v) for v in values[i:i + per_line]) for i in range(0, len(values), per_line)]
    return "\n    " + ",\n    ".join(rows) + "\n"


def golden_header(repo_root: Path) -> str:
    """Text of firmware/test/test_acoustic/golden_vectors.h."""
    lines = [
        "/* GENERATED by analytics/utils/acoustic_summary.py --write-golden. Do not edit.",
        " * Expected outputs come from the Python reference, the specification of the summary. */",
        "#ifndef SCOUT_ACOUSTIC_GOLDEN_H",
        "#define SCOUT_ACOUSTIC_GOLDEN_H",
        "",
        "#include <stdint.h>",
        "",
        "enum { SCOUT_SYNTH_SILENCE, SCOUT_SYNTH_TONE, SCOUT_SYNTH_NOISE, SCOUT_SYNTH_IMPULSES,",
        "       SCOUT_SYNTH_SQUARE };",
        "",
        "typedef struct {",
        "    const char *name;",
        "    int kind;",
        "    uint32_t n, p1, p2, p3;",
        "    int16_t expect[5]; /* lvl_anthro, lvl_mixed, lvl_bio, lvl_broad, ndsi_e4 */",
        "    uint16_t expect_snaps, expect_clips;",
        "} GoldenSynth;",
        "",
        f"static const int16_t GOLDEN_SINE_Q15[256] = {{{_c_array(SINE_TABLE)}}};",
        "",
        "static const GoldenSynth GOLDEN_SYNTH[] = {",
    ]
    for name, kind, p1, p2, p3 in GOLDEN_SYNTH:
        r = summarize(synth(kind, GOLDEN_N, p1, p2, p3)).as_tuple()
        lines.append(f'    {{"{name}", {_KIND_NAMES[kind]}, {GOLDEN_N}u, {p1}u, {p2}u, {p3}u,')
        lines.append(f"     {{{r[0]}, {r[1]}, {r[2]}, {r[3]}, {r[4]}}}, {r[5]}u, {r[6]}u}},")
    lines.append("};")
    excerpt = _real_excerpt(repo_root)
    r = summarize(excerpt).as_tuple()
    lines += [
        "",
        f"/* {Path(_REAL_EXCERPT[0]).name}, samples {_REAL_EXCERPT[1]}..{_REAL_EXCERPT[1] + _REAL_EXCERPT[2] - 1}"
        " at 22,050 Hz, quantised to 12 bits. */",
        f"static const uint16_t GOLDEN_REAL[{len(excerpt)}] = {{{_c_array(excerpt)}}};",
        f"static const int16_t GOLDEN_REAL_EXPECT[5] = {{{r[0]}, {r[1]}, {r[2]}, {r[3]}, {r[4]}}};",
        f"static const uint16_t GOLDEN_REAL_SNAPS = {r[5]}u;",
        f"static const uint16_t GOLDEN_REAL_CLIPS = {r[6]}u;",
        "",
        "#endif /* SCOUT_ACOUSTIC_GOLDEN_H */",
        "",
    ]
    return "\n".join(lines)


def config_h_block(config: AcousticConfig | None = None) -> str:
    """The ACOUSTIC_BIQUADS initialiser rows as they must appear in firmware/src/config.h."""
    config = config or AcousticConfig()
    return "\n".join(f"    {{{c.c1}, {c.gain}, {c.a1}, {c.a2}, {c.shift}}},"
                     for c in config.sections)


def main() -> None:
    parser = argparse.ArgumentParser(description="S.C.O.U.T. acoustic summary reference")
    parser.add_argument("--write-golden", action="store_true",
                        help="regenerate firmware/test/test_acoustic/golden_vectors.h")
    parser.add_argument("--print-config", action="store_true",
                        help="print the ACOUSTIC_BIQUADS rows for config.h")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    if args.print_config:
        print(config_h_block())
    if args.write_golden:
        target = root / "firmware" / "test" / "test_acoustic" / "golden_vectors.h"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(golden_header(root))
        print(f"wrote {target.relative_to(root)}")


if __name__ == "__main__":
    main()
