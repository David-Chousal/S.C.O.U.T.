# Shaghaghi et al. (2020) — ÂB / EACP energy-aware communication protocol

- **Registry key:** `shaghaghi-2020` · [sources.md](../sources.md) · ❓ access to confirm
- **Citation:** Shaghaghi et al. (2020). ÂB / EACP — energy-aware communication protocol.
  *Venue and DOI to confirm.* Authored by SCOUT faculty advisor **Navid Shaghaghi** — obtain
  the PDF directly from him.

> **Status:** seed note. Assigned as team reading homework in the
> [Team Timeline](../../planning/team-timeline.md) ("come to check-in able to explain it in one
> paragraph"). Fill the paragraph below once the paper is read.

## In one paragraph

*(To write after reading.)* The protocol SCOUT is adapting for the buoy ↔ shore link. Core idea
to capture: **sleep-wake synchronization** — how the buoy and shore station agree on when the
radio is on, so both sleep as much as possible without missing the daily packet exchange.

## Why it matters to SCOUT

The buoy's power budget depends on the radio being off almost all the time
([facts.md](../facts.md): 82-byte packet, 1×/day). This paper is the reference design for the
duty-cycled, energy-aware link that makes a 1+ year unattended deployment feasible. It directly
informs the firmware TX state machine and the shore-station receive window.

## Follow-ups

- Confirm venue + DOI and set the access mark in [sources.md](../sources.md).
- Extract the sleep-wake sync mechanism into the firmware/shore-station design notes.
