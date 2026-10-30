# S.C.O.U.T. Deployment Partner Blurb, October 2026

> **Summary** — One-page introduction to S.C.O.U.T. for Dr. Krishnan to forward to NOAA contacts and
> the San Diego underwater-robotics contact ([SCO-261](https://linear.app/scout1/issue/SCO-261),
> from the 2026-10-28 advisor meeting). It explains the project, where it stands, what we are
> asking for, and where it could go. Print it on one US Letter page or paste it into an email.
>
> Part of [`docs/planning/`](.). Canonical values live in the [Knowledge Hub facts](../hub/facts.md).

---

## S.C.O.U.T. — a low-cost, long-life buoy for nearshore reef monitoring

**Santa Clara Oceanic Utilities Transmitter** · Santa Clara University Senior Design Capstone, 2026–2027
Team: Isabella Rodriguez (electrical), John Ryan Myrdal (mechanical and field), David Chousal Cantu (software)
Advisors: Dr. Shoba Krishnan, Dr. Jes Kuczenski, Dr. Navid Shaghaghi

**The problem.** Reef monitoring buoys cost tens of thousands of dollars, and researchers we interviewed
described sites where data is collected by hand only every few years. Shallow reefs, where bleaching
and sedimentation start, are the least instrumented.

**What we are building.** A small, battery-powered, modular buoy that sits next to a shallow reef and
is left alone. It logs water temperature and turbidity, stores everything on board, and sends a
44-byte summary packet to a shore station over LoRa, three times a day. It needs no cellular service
or internet at the buoy. A hydrophone will add a reef soundscape summary (snapping-shrimp activity is
a candidate proxy for reef health). On shore, our pipeline turns temperature into NOAA Coral Reef
Watch style Degree Heating Weeks and bleaching alert levels, and screens data with QARTOD-style tests.

**Design targets.** Total system cost under $5,000 · 1+ year unattended · 2 to 8 m depth · reef-safe
mooring (no drilling, non-corroding hardware) · antifouling coating · fully 3D-printed hull (PETG) that
self-rights from any angle.

**Status (late October 2026).**
- Done: system architecture, data pipeline and web dashboard, receiver console, radio link
  design, and the buoy hull design with stability and load analysis.
- In progress: first sensor bring-up on the bench (temperature first, with a written test protocol),
  waterproofing tests of the electronics housing and sensor pod, assembly of the buoy and shore boards.
- Not yet done: in-water field test, hydrophone purchase, salt-water and pressure testing.

**Plan.** Bench tests this quarter, a short field prototype deployment January–February 2027, and a
live deployment at a Hawaii reef site March–May 2027.

**What we are asking.**
1. A site: a dock, pier or marina where we can hang a prototype for a short pilot, in California or Hawaii.
2. Guidance on the permits and agencies that apply to a small instrumented buoy in 2 to 8 m of
   nearshore water. We have quotes from marinas of about $250 to review an application and $250+ plus
   insurance to deploy, and we have been told NOAA approval can take months, so early direction matters.
3. Introductions to reef scientists or monitoring programs who would use or comment on the data.
4. Feedback on the sensors and data products you would want from a low-cost buoy.

**Where it can go.** The sensing payload is modular, so the same buoy, power system and shore link can
be re-tasked. Planned additions: light, chlorophyll and (as a stretch) dissolved oxygen, plus a
multi-depth sensor string. Beyond the capstone: a custom circuit board for production, many buoys
reporting to one shore station or cloud service, and use for water-quality tracking and satellite
ground-truthing alongside reef monitoring.

**Contact.** John Ryan Myrdal, jmyrdal@scu.edu · Code, designs and test records are open at
https://github.com/David-Chousal/S.C.O.U.T.
