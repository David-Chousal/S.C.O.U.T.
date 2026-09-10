# Received telemetry (live)

Real CSVs from the shore station land here, one file per buoy per UTC day
(`SCOUT-01_20260814.csv`), exactly as [data-schema.md](../../docs/engineering/data-schema.md)
specifies. **This directory is tracked in git** — that is the whole point of it.

## Why this is separate from `../data/`

`../data/` is gitignored scratch for loopback and demo runs, and the Pages workflow
regenerates it from the simulator on every build. If received telemetry lived there it would
be destroyed on the next hourly run, and the public dashboard would go back to showing
simulated numbers with no error anywhere.

Keeping the two apart means the regeneration step has no path to real data even if the
selection logic in [`scout_shore/publish.py`](../scout_shore/publish.py) were bypassed.

## What publishing does with it

The moment this directory contains a `.csv`, the Pages workflow builds the public dashboard
from it instead of the simulator, and drops the sample-data banner. Nothing else has to change
— no workflow edit, no flag.

Until then it holds only this README and a `.gitkeep`, neither of which counts as telemetry.
