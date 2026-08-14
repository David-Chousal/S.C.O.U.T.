# Team Meeting Notes

> **Summary** — Running notes from team design meetings, beginning with the 2026-05-08 component brainstorm.
>
> **Source document** — `Meeting Notes_.docx`

---

**Attendees** — John Myrdal · Isabella Rodriguez · David Chousal Cantu

---

**5/8/2026**

**Brainstorming and First Steps:**

## STATIONARY NEARSHORE DATA COLLECTING BUOY COMPONENTS

### Hardware

- Thermistor

- Oxygen Level Sensor

- Hydrophone/Sonar?

- Accelorometer/IMU

- CPU

- Long Distance Radio

### Power Generation & Management

> A battery alone won't last long if we are doing signal processing or long-distance transmission.

- **Solar Panels & Mounts:** Flexible or rigid panels are standard. We’ll need a **Solar Charge Controller (MPPT)** to efficiently charge the battery.

- **Power Management System (PMS):** A dedicated board to handle "sleep cycles." We want the CPU to wake up, sample, transmit, and go back to sleep to save power.

- **Real-Time Clock (RTC):** If our CPU is in deep sleep, we need an ultra-low-power RTC to "wake" the system for scheduled data dumps.

### Software

- Off-board data center / database for data analysis

- Signal processing software (Continuously transmitting or periodic data dump? Look into energy/computing costs)

- Data processing software - Traditional or neural network.

### Software & Data Strategy

- **On-board Logging (SD Card):** Always have a "black box" backup. If the radio fails, we want the data saved locally for when the buoy is recovered

- **Watchdog Timer (WDT):** A hardware or software "dead man's switch." If our code freezes due to a bug, the WDT will force a hard reboot.

- **State of Health (SoH) Telemetry:** Don't just send oxygen levels; send battery voltage, internal temperature, and humidity. This tells us if our buoy is "dying" before it actually does.

### Communications & Navigation

- **LoRa** technology provides reliable, low-power ship-to-shore communication over seawater, bypassing the need for cellular or satellite coverage. *(Correction, 2026-08-14: the "15–20+ km" figure noted here was optimistic. The RFM95 does ~2 km line-of-sight with a tuned antenna per the Adafruit range FAQ; real over-saltwater range is expected to be lower and will be measured in Phase 4.)*

### Marine Safety & Legal Requirements

> To prevent our buoy from being a "hazard to navigation" (and to stop ships from potentially hitting it), we need specific hardware:

- **Navigation Light:** A yellow flashing LED (required by Coast Guard/IALA regulations for "Special Marks").

- **Radar Reflector:** A passive metal shape that makes our buoy visible on a ship’s radar.

- **AIS (Automatic Identification System):** A transponder that broadcasts its position to nearby ships (highly recommended for high-traffic areas).

### Structure 

- Floatation device

- Electronic hardware & transmitter housing

- Sensor housing

- Ballast

- Anchor/subsea securing system

### Structural Durability & Maintenance

> The ocean is a "universal solvent." We need to protect the buoy from the elements.

- **Biofouling Protection:** Sensors (especially the O2 sensor) will be covered in algae within weeks. Look into **copper mesh** or **mechanical wipers** for the sensor faces.

- **Sacrificial Anodes:** Zinc or aluminum blocks bolted to the metal frame to prevent "Galvanic Corrosion" from eating our structural components.

- **Desiccant Packs:** Even a "sealed" housing will have humidity. Use silica gel packets inside to prevent condensation on our electronics.

- **Mooring Hardware:** We listed "Anchor," but let’s not forget **swivels** (to prevent the rope from tangling as the buoy spins) and **shackles** with seizing wire.
