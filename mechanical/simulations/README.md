# Mechanical Simulations and Calculators

> **Summary** — Re-runnable engineering calculators for the buoy: code, inputs, and dated results.
> Open a calculator's `README.md` for what it computes and how to run it. The **newest results
> folder is always the current answer**; older dated folders are kept as history.
>
> Part of [`mechanical/`](../README.md). Method write-ups live in
> [`docs/engineering/buoy-structural/`](../../docs/engineering/buoy-structural/README.md).

---

## Calculators

| Calculator | Computes | Current results | Interactive |
|---|---|---|---|
| [`buoy-stability/`](buoy-stability/README.md) | Waterline, freeboard, GM, full righting-arm curve (0–180°), self-righting check, minimum ballast, sweeps over housing mass / cap height / ballast depth | [`results/2026-09-29/`](buoy-stability/results/2026-09-29/) | [`stability-explorer.html`](buoy-stability/results/2026-09-29/stability-explorer.html) (download and open in a browser) |

## How "current" is marked

- **Code is never versioned by filename** ([CONVENTIONS § Versions](../../docs/CONVENTIONS.md#versions)).
  Each calculator has one live copy; git history holds earlier states, and each calculator's
  README keeps a dated changelog.
- **Results are dated folders:** `results/YYYY-MM-DD/`. The latest date is current, and this
  table links it. Re-running a calculator writes a new dated folder; don't edit old ones.
- **Inputs change → re-run → new folder → update this table** in the same PR.
