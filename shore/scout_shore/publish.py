"""Which telemetry the published dashboard is built from — real data, or the simulator.

The GitHub Pages workflow rebuilds the public dashboard hourly. Until the buoy is live there
is nothing real to show, so it generates 30 days of simulated telemetry and labels the page
with a sample-data banner. That is fine *only* while no real data exists.

The failure this module prevents: the workflow had no branch in it. It regenerated the
simulator's output every run, unconditionally. The first time the shore station landed real
CSVs in the repo, the next scheduled run — within the hour, with no human involved — would
rebuild the site from simulated readings and stamp them "not a live deployment". No error, no
failed check, no diff to notice. The dashboard would simply stop showing the deployment while
continuing to look healthy, which is the worst shape a data bug can take.

So the choice is made here, once, and tested:

- **Real data present** → publish it, with no sample banner.
- **No real data** → run the simulator into its *own* directory and label the result.

The two directories are deliberately separate. ``data-live/`` is tracked and is where received
CSVs land; ``data/`` is gitignored scratch for loopback and demo runs. The regeneration step
targets the scratch directory by construction, so it has no path to overwrite real readings
even if this logic were bypassed.

Standard library only — this runs in CI and on a bare Raspberry Pi.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

# Shown atop the dashboard when the numbers came from the simulator. Real data gets no banner:
# a live deployment labelled "simulated" misleads exactly the reader the page exists for.
SAMPLE_BANNER = (
    "Sample data: simulated telemetry for demonstration, not a live deployment."
)

# Where the shore station's received CSVs land. Tracked in git, unlike the scratch directory.
LIVE_DIR = Path("shore/data-live")
# Loopback and demo output. Gitignored; safe to clobber on every CI run.
SAMPLE_DIR = Path("shore/data")


@dataclass(frozen=True)
class SourceChoice:
    """What the dashboard build should read, and how the page should describe it."""

    source: Path
    simulate: bool  # run the simulator first? Never true when real data was found.
    banner: str | None  # None means "say nothing" — the data speaks for itself.

    def as_github_output(self) -> str:
        """Render as ``key=value`` lines for ``$GITHUB_OUTPUT``.

        ``simulate`` is lowercased because Actions compares step outputs as strings: a
        Python ``True`` would render as ``True`` and ``== 'true'`` would never match, which
        would silently skip the generate step and build the site from an empty directory.
        """
        banner = self.banner or ""
        # A newline here would end the `banner=` line early and let the remainder be parsed as
        # further step outputs — a corrupted build at best, output injection at worst. Nothing
        # today produces one; this refuses to be the reason a future edit does it silently.
        if "\n" in banner or "\r" in banner:
            raise ValueError("banner must be a single line to be a safe GitHub Actions output")
        return (
            f"source={self.source}\n"
            f"simulate={'true' if self.simulate else 'false'}\n"
            f"banner={banner}\n"
        )


def has_telemetry(directory: Path) -> bool:
    """True when this directory holds at least one telemetry CSV.

    Checked by content, not by existence: the live directory is committed with a ``.gitkeep``
    and a README so the path survives a clone, and neither of those makes the buoy live.
    """
    if not directory.is_dir():
        return False
    return any(directory.glob("*.csv"))


def select_source(
    *,
    live_dir: Path = LIVE_DIR,
    sample_dir: Path = SAMPLE_DIR,
) -> SourceChoice:
    """Decide what the published dashboard is built from.

    Real data always wins. There is no flag to override that, because every reason to publish
    the simulator over a live deployment is a mistake.
    """
    if has_telemetry(live_dir):
        return SourceChoice(source=live_dir, simulate=False, banner=None)
    return SourceChoice(source=sample_dir, simulate=True, banner=SAMPLE_BANNER)


def main() -> None:
    """Print the choice as ``$GITHUB_OUTPUT`` lines. Used by the Pages workflow."""
    import argparse

    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--live-dir", type=Path, default=LIVE_DIR)
    parser.add_argument("--sample-dir", type=Path, default=SAMPLE_DIR)
    args = parser.parse_args()
    print(select_source(live_dir=args.live_dir, sample_dir=args.sample_dir).as_github_output(), end="")


if __name__ == "__main__":
    main()
