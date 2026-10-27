"""Acoustic summary reference (ADR-0010, SCO-233).

``utils/acoustic_summary.py`` is the specification the firmware ports. These tests pin its
behaviour, and keep it in lockstep with the three places that copy it: the bands in
``acoustic_indices.py``, the constants in ``firmware/src/config.h``, and the golden vectors in
``firmware/test/test_acoustic/golden_vectors.h``. Standard library only (no maad import).
"""

from __future__ import annotations

import math
import re
import unittest
from pathlib import Path

from utils.acoustic_summary import (
    ANTHRO_BAND,
    BIO_BAND,
    GOLDEN_N,
    GOLDEN_SYNTH,
    INT16_MIN,
    KIND_IMPULSES,
    KIND_NOISE,
    KIND_SILENCE,
    KIND_SQUARE,
    KIND_TONE,
    MIXED_BAND,
    SECTION_DESIGN,
    SECTIONS,
    SUMMARY_SIZE,
    UINT16_MAX,
    AcousticConfig,
    AcousticSummarizer,
    AcousticSummary,
    design_biquad,
    level_cdb,
    log2_q16,
    ndsi_e4,
    phase_increment,
    quantize_to_adc,
    summarize,
    synth,
)

_ROOT = Path(__file__).resolve().parents[3]
_CONFIG_H = _ROOT / "firmware" / "src" / "config.h"
_GOLDEN_H = _ROOT / "firmware" / "test" / "test_acoustic" / "golden_vectors.h"
_INDICES = _ROOT / "analytics" / "utils" / "acoustic_indices.py"
_CAPTURE_TEST = _ROOT / "firmware" / "test" / "test_capture" / "test_capture.cpp"


def _tone(freq_hz: float, amplitude: int = 1000, n: int = 22050) -> AcousticSummary:
    return summarize(synth(KIND_TONE, n, phase_increment(freq_hz), amplitude, 0))


def _c_const(text: str, name: str) -> int:
    match = re.search(rf"\b{name}\s*=\s*(-?\d+)\s*;", text)
    if not match:
        raise AssertionError(f"{name} not found in config.h")
    return int(match.group(1))


class LockstepTests(unittest.TestCase):
    """The reference must agree with every copy of itself."""

    def test_bands_equal_the_shore_pipeline(self):
        text = _INDICES.read_text()
        for name, band in (("BIO_BAND", BIO_BAND), ("ANTHRO_BAND", ANTHRO_BAND),
                           ("MIXED_BAND", MIXED_BAND)):
            match = re.search(rf"^{name}\s*=\s*\((\d+),\s*(\d+)\)", text, re.MULTILINE)
            self.assertIsNotNone(match, name)
            self.assertEqual((int(match.group(1)), int(match.group(2))), band, name)

    def test_frozen_sections_equal_their_design(self):
        self.assertEqual(tuple(design_biquad(*d) for d in SECTION_DESIGN), SECTIONS)

    def test_config_h_carries_the_same_filter_coefficients(self):
        text = _CONFIG_H.read_text()
        block = re.search(r"ACOUSTIC_BIQUADS\[6\]\[5\]\s*=\s*\{(.*?)\};", text, re.DOTALL)
        self.assertIsNotNone(block)
        rows = [tuple(int(v) for v in row.split(","))
                for row in re.findall(r"\{([-\d,\s]+)\}", block.group(1))]
        self.assertEqual(rows, [(s.c1, s.gain, s.a1, s.a2, s.shift) for s in SECTIONS])

    def test_config_h_carries_the_same_scalar_constants(self):
        text = _CONFIG_H.read_text()
        cfg = AcousticConfig()
        expected = {
            "ACOUSTIC_SAMPLE_RATE_HZ": 22050,
            "ACOUSTIC_INPUT_SHIFT": cfg.input_shift,
            "ACOUSTIC_DC_POLE_SHIFT": cfg.dc_pole_shift,
            "ACOUSTIC_DC_FRAC_BITS": cfg.dc_frac_bits,
            "ACOUSTIC_SNAP_THRESHOLD_Q4": cfg.snap_threshold_q4,
            "ACOUSTIC_SNAP_MIN_ABS": cfg.snap_min_abs,
            "ACOUSTIC_SNAP_REFRACTORY_SAMPLES": cfg.snap_refractory_samples,
            "ACOUSTIC_SNAP_FLOOR_SHIFT": cfg.snap_floor_shift,
            "ACOUSTIC_SNAP_WARMUP_SAMPLES": cfg.snap_warmup_samples,
            "ACOUSTIC_SNAP_WARMUP_SHIFT": cfg.snap_warmup_shift,
            "ACOUSTIC_CLIP_MARGIN": cfg.clip_margin,
            "ADC_RESOLUTION_BITS": cfg.adc_bits,
        }
        for name, value in expected.items():
            self.assertEqual(_c_const(text, name), value, name)

    def test_golden_header_is_current(self):
        """Regenerate with `python -m utils.acoustic_summary --write-golden` if this fails."""
        text = _GOLDEN_H.read_text()
        rows = re.findall(r'\{"(\w+)", \w+, (\d+)u, (\d+)u, (\d+)u, (\d+)u,\s*'
                          r'\{(-?\d+), (-?\d+), (-?\d+), (-?\d+), (-?\d+)\}, (\d+)u, (\d+)u\}', text)
        self.assertEqual([r[0] for r in rows], [g[0] for g in GOLDEN_SYNTH])
        for row, (name, kind, p1, p2, p3) in zip(rows, GOLDEN_SYNTH):
            self.assertEqual(tuple(int(v) for v in row[1:5]), (GOLDEN_N, p1, p2, p3), name)
            expected = summarize(synth(kind, GOLDEN_N, p1, p2, p3)).as_tuple()
            self.assertEqual(tuple(int(v) for v in row[5:]), expected, name)

    def test_golden_real_excerpt_expectation_is_current(self):
        text = _GOLDEN_H.read_text()
        samples = [int(v) for v in re.search(r"GOLDEN_REAL\[\d+\] = \{([^}]*)\}", text).group(1)
                   .split(",")]
        levels = re.search(r"GOLDEN_REAL_EXPECT\[5\] = \{([^}]*)\}", text).group(1)
        snaps = int(re.search(r"GOLDEN_REAL_SNAPS = (\d+)u", text).group(1))
        clips = int(re.search(r"GOLDEN_REAL_CLIPS = (\d+)u", text).group(1))
        expected = tuple(int(v) for v in levels.split(",")) + (snaps, clips)
        self.assertEqual(summarize(samples).as_tuple(), expected)
        self.assertGreater(snaps, 0, "the real excerpt should exercise the snap detector")


class CaptureFileTests(unittest.TestCase):
    """The WAV files the buoy writes (lib/scout_capture) must be files the shore pipeline reads."""

    def test_firmware_wav_header_equals_the_wave_module(self):
        import io
        import wave

        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(22050)
            w.writeframes(bytes(2 * 22050 * 60))
        text = _CAPTURE_TEST.read_text()
        block = re.search(r"GOLDEN_WAV_HEADER\[[^\]]*\]\s*=\s*\{([^}]*)\}", text).group(1)
        firmware = bytes(int(b, 16) for b in re.findall(r"0x([0-9a-fA-F]{2})", block))
        self.assertEqual(firmware, buffer.getvalue()[:44])


class LevelTests(unittest.TestCase):
    def test_no_samples_gives_all_zero_fields(self):
        self.assertEqual(summarize([]), AcousticSummary())

    def test_silence_reads_as_silent_with_no_events(self):
        r = summarize([2048] * 22050)
        self.assertEqual((r.lvl_anthro_cdb, r.lvl_mixed_cdb, r.lvl_bio_cdb, r.lvl_broad_cdb),
                         (INT16_MIN,) * 4)
        self.assertEqual((r.ndsi_e4, r.snap_count, r.clip_count), (0, 0, 0))

    def test_full_scale_sine_is_zero_dbfs_broadband(self):
        self.assertAlmostEqual(_tone(1000, amplitude=2047).lvl_broad_cdb, 0, delta=5)

    def test_pure_tone_lands_in_its_band(self):
        expected_cdb = round(2000 * math.log10(1000 / 2047))  # −6.2 dBFS
        for freq, band in ((100, 0), (500, 1), (3000, 2)):
            r = _tone(freq)
            levels = (r.lvl_anthro_cdb, r.lvl_mixed_cdb, r.lvl_bio_cdb)
            for other in range(3):
                if other != band:
                    self.assertGreater(levels[band], levels[other] + 1000, f"{freq} Hz")
            self.assertAlmostEqual(levels[band], expected_cdb, delta=60, msg=f"{freq} Hz")

    def test_ndsi_follows_the_dominant_band(self):
        self.assertLess(_tone(100).ndsi_e4, -9900)
        self.assertGreater(_tone(3000).ndsi_e4, 9900)

    def test_level_helpers(self):
        self.assertEqual(level_cdb(0, 0, 100), 0)
        self.assertEqual(level_cdb(0, 10, 100), INT16_MIN)
        self.assertEqual(level_cdb(100 * 10, 10, 100), 0)  # mean power == reference
        self.assertEqual(level_cdb(1000 * 10, 10, 100), 1000)  # +10 dB

    def test_ndsi_helper_keeps_precision_with_huge_energies(self):
        self.assertEqual(ndsi_e4(3 << 60, 1 << 60), 5000)
        self.assertEqual(ndsi_e4(0, 0), 0)
        self.assertEqual(ndsi_e4(0, 5), -10000)

    def test_log2_q16(self):
        self.assertEqual(log2_q16(1), 0)
        self.assertEqual(log2_q16(2), 1 << 16)
        self.assertEqual(log2_q16(3), 103872)
        self.assertAlmostEqual(log2_q16(10 ** 12) / 65536, math.log2(10 ** 12), delta=1e-4)
        with self.assertRaises(ValueError):
            log2_q16(0)


class ClipTests(unittest.TestCase):
    def test_full_scale_square_clips_every_sample(self):
        self.assertEqual(summarize(synth(KIND_SQUARE, 5000, 11, 0, 0)).clip_count, 5000)

    def test_clip_margin_edges(self):
        self.assertEqual(summarize([0, 16, 4079, 4095]).clip_count, 4)
        self.assertEqual(summarize([17, 2048, 4078, 3000]).clip_count, 0)

    def test_out_of_range_samples_are_clamped_to_the_rail(self):
        self.assertEqual(summarize([4096, 60000, -5]).clip_count, 3)

    def test_clip_count_saturates(self):
        self.assertEqual(summarize([4095] * 70000).clip_count, UINT16_MAX)


class SnapTests(unittest.TestCase):
    def test_impulse_train_counts_each_impulse_once(self):
        cfg = AcousticConfig()
        expected = sum(1 for i in range(cfg.snap_warmup_samples, 22050) if i % 200 == 100)
        r = summarize(synth(KIND_IMPULSES, 22050, 99, 1500, 200))
        self.assertEqual(r.snap_count, expected)

    def test_refractory_window_merges_close_impulses(self):
        noise = synth(KIND_NOISE, 400 * 60, 5, 4, 0)
        pairs = 0
        for block in range(60):
            noise[block * 400 + 100] += 1500
            noise[block * 400 + 130] += 1500  # 30 samples later: inside the 66-sample window
            pairs += block * 400 + 100 >= AcousticConfig().snap_warmup_samples
        self.assertEqual(summarize(noise).snap_count, pairs)

    def test_white_noise_alone_counts_no_snaps(self):
        self.assertEqual(summarize(synth(KIND_NOISE, 22050 * 2, 4242, 600, 0)).snap_count, 0)

    def test_snap_count_saturates(self):
        # Threshold and floor at zero with no window: every non-zero bio sample is a "snap", so
        # saturation is reachable in a test-sized input. The firmware test does it with the
        # flight config over 5.6 M samples.
        cfg = AcousticConfig(snap_threshold_q4=0, snap_min_abs=0, snap_refractory_samples=0,
                             snap_warmup_samples=0)
        self.assertEqual(summarize(synth(KIND_NOISE, 70000, 1, 800, 0), cfg).snap_count,
                         UINT16_MAX)

    def test_threshold_outside_firmware_range_is_rejected(self):
        with self.assertRaises(ValueError):
            AcousticConfig(snap_threshold_q4=256)


class StreamingTests(unittest.TestCase):
    def test_result_does_not_depend_on_block_size(self):
        samples = synth(KIND_IMPULSES, GOLDEN_N, 777, 1500, 200)
        whole = summarize(samples)
        chunked = AcousticSummarizer()
        for i in range(0, len(samples), 37):
            chunked.feed(samples[i:i + 37])
        self.assertEqual(chunked.finalize(), whole)

    def test_finalize_leaves_state_unchanged(self):
        s = AcousticSummarizer()
        s.feed(synth(KIND_NOISE, 3000, 9, 300, 0))
        self.assertEqual(s.finalize(), s.finalize())

    def test_summary_packs_to_fourteen_bytes_in_adr_order(self):
        r = AcousticSummary(-1, -2, -3, -4, -5, 6, 7)
        self.assertEqual(SUMMARY_SIZE, 14)
        self.assertEqual(r.to_bytes().hex(), "ffff" "feff" "fdff" "fcff" "fbff" "0600" "0700")

    def test_quantize_to_adc(self):
        self.assertEqual(quantize_to_adc([0.0, -1.0, 0.99999, 1.5, -2.0]),
                         [2048, 0, 4095, 4095, 0])

    def test_silence_kind_is_constant(self):
        self.assertEqual(set(synth(KIND_SILENCE, 10, 1234, 0, 0)), {1234})


if __name__ == "__main__":
    unittest.main()
