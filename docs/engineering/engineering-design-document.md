# SCOUT Engineering Design Document (v0.2)

> **Summary** — The authoritative technical baseline: system requirements, mechanical/electrical/firmware architecture, component selection, power and energy budget, verification plan, and full BOM.
>
> **Source document** — `JR Energy Budget.docx`
>
> **Note** — the source file was named `JR Energy Budget.docx`, but its contents are the complete engineering design document. Renamed here to reflect actual content.

> ⚠️ **Platform note (2026-08-14).** This document describes the **ESP32-C3 + SX1262 custom
> PCB**, which — per [ADR-0001](../decisions/0001-mcu-and-radio-selection.md) — is now the
> project's **future production target**, not the platform being built for the capstone. The
> **confirmed build platform is the Adafruit Feather M0 + RFM95** (see
> [`hardware/README.md`](../../hardware/README.md) and [`firmware/README.md`](../../firmware/README.md)).
> Consequently the ESP32-C3/SX1262 references throughout, and the power/energy analysis in
> §15–17, apply to the production target; a Feather-specific power budget will be produced
> empirically during Phase 1–4 testing. Sections have **not** been rewritten so this remains
> the reference design for the eventual PCB.

---

## 1. Executive Summary

### Project Overview

SCOUT (Santa Clara Oceanic Utilities Transmitter) is a low-cost, long-duration environmental monitoring buoy intended for deployment on shallow coral reefs. The system is designed to autonomously collect environmental data while minimizing power consumption, maintenance requirements, hardware complexity, and overall cost.

SCOUT operates as a self-contained sensing platform powered by a rechargeable LiFePO₄ battery and solar energy harvesting system. The buoy periodically measures environmental conditions, records underwater acoustic data, stores all information locally, and transmits summarized daily data to a nearby shore station using LoRa radio communication.

The system is intended to remain deployed for extended periods with minimal human interaction while maintaining reliable operation in a marine environment.

### Primary Objectives

- Develop an inexpensive reef-monitoring platform.

- Operate autonomously for long-duration deployments.

- Minimize daily energy consumption.

- Minimize maintenance requirements.

- Maintain a modular, serviceable design.

- Enable future expansion without major architectural changes.

### Functional Overview

SCOUT performs four primary tasks:

1.  Measure water temperature.

2.  Measure water turbidity.

3.  Record underwater acoustic data.

4.  Transmit summarized daily data.

All raw data is stored locally while summarized environmental data is transmitted once per day.

### Design Philosophy

- Simplicity over unnecessary complexity.

- Minimize total component count.

- Minimize standby power consumption.

- Power hardware only when required.

- Maintain modular hardware architecture.

- Use commercially available components whenever practical.

- Clearly separate engineering assumptions from manufacturer specifications.

### Current Design Status

- Mechanical architecture complete.

- Electrical architecture complete.

- Firmware architecture complete.

- Hardware selection complete.

- Major assumptions documented.

- Daily power budget in progress.

- Battery and solar sizing pending final verified power budget.

## 2. System Requirements

### Functional Requirements

The SCOUT buoy shall:

- Measure water temperature using one sensor (per [ADR-0003](../decisions/0003-single-point-sensing.md); 2 additional units held as field spares).

- Measure water turbidity using one sensor (per ADR-0003; 2 additional units held as field spares).

- Record underwater acoustic data using one hydrophone.

- Store all collected information locally.

- Transmit summarized sensor data once per day via LoRa.

- Operate autonomously.

- Recover automatically after temporary power interruption.

- Enter ultra-low-power sleep whenever inactive.

### Performance Requirements

#### Temperature

- One sensor deployed (+2 spares — ADR-0003)

- Six measurements/day

- Waterproof

#### Turbidity

- One sensor deployed (+2 spares — ADR-0003)

- Six measurements/day

- Analog optical sensing

#### Audio

- One hydrophone

- Mono

- 16-bit PCM

- 16 kHz

- Three 60-second recordings/day

#### Communications

- LoRa

- 915 MHz

- +14 dBm

- 125 kHz bandwidth

- SF7

- Coding Rate 4/5

- One transmission/day

### Storage Requirements

- Store all raw audio.

- Store all environmental measurements.

- Approximately 30-day onboard retention.

- Firmware-managed storage.

### Power Requirements

- LiFePO₄ battery

- Solar charging

- Ultra-low standby power

- Switch high-power sensors off between measurements

### Reliability Requirements

- Autonomous operation

- Resume after reset

- Protect stored data

- Minimize failure points

### Design Constraints

- Low cost

- Marine environment

- Fits within approximately a 4-inch Schedule 40 PVC electronics housing

- Low average power

- Modular construction

## 3. Overall System Architecture

### System Description

SCOUT is organized into six major subsystems:

1.  Mechanical Structure

2.  Power System

3.  Sensor System

4.  Processing System

5.  Storage System

6.  Communications System

Each subsystem operates independently but is coordinated by the ESP32-C3 microcontroller.

### High-Level Architecture

Solar Panel

│

BQ25570 MPPT

│

LiFePO₄ Battery

│

┌──────────────┴──────────────┐

│ │

TPS62840 TPS61299

3.3 V Rail 5 V Rail

│ │

│ TPS22916 Load Switches

│ │

│ ┌───────────┴───────────┐

│ │ │

ESP32-C3 PCM1808 ADC SEN0189 ×3

│ │

│ Aquarian H2dM

│

┌────────┼────────┬──────────┐

│ │ │ │

SX1262 W25Q02JV DS18B20×3 Other GPIO

LoRa Flash

### Subsystem Responsibilities

#### Mechanical

- Supports all electronics.

- Provides waterproof enclosure.

- Supports solar panel.

- Supports mooring.

- Positions sensors at required depths.

#### Power

- Harvest solar energy.

- Charge battery.

- Generate regulated voltages.

- Switch high-power loads on demand.

#### Sensors

Collect:

- Water temperature

- Water turbidity

- Underwater acoustic data

#### Processing

The ESP32-C3 performs:

- Sensor scheduling

- Data acquisition

- Audio streaming

- Flash management

- LoRa communications

- Power management

- Fault recovery

#### Storage

Stores:

- Raw hydrophone recordings

- Temperature history

- Turbidity history

- Device status

- Configuration information

#### Communications

The SX1262 LoRa transceiver transmits one summarized packet per day to a shore receiver.

Raw audio is not transmitted.

### Data Flow

Sensors

│

▼

ESP32-C3

│

├── Process measurements

├── Store raw data

└── Generate daily summary

│

▼

SX1262 LoRa

│

▼

Shore Station

## 4. Mechanical Architecture

### Design Goals

The mechanical system was designed to:

- Protect electronics from seawater.

- Support long-term deployment.

- Simplify manufacturing.

- Simplify maintenance.

- Reduce part count.

- Allow modular replacement of subsystems.

### Main Housing

Electronics are contained inside a vertical enclosure based on approximately a 4-inch Schedule 40 PVC tube.

The housing contains:

- Main PCB

- Battery

- Voltage regulators

- LoRa antenna

- Flash memory

- Internal wiring

### Sensor Mount

Per [ADR-0003](../decisions/0003-single-point-sensing.md), sensors are sited together at a single point beneath the buoy (not a multi-depth string):

- One DS18B20 temperature sensor (+2 field spares)

- One turbidity sensor (+2 field spares)

- One Aquarian hydrophone

A future revision may distribute sensors vertically to sample multiple depths — see [Sensor String Architecture](sensor-string-architecture.md).

### Float Assembly

The float assembly provides:

- Positive buoyancy

- Solar panel mounting

- Electronics enclosure support

- Mooring attachment

### Mooring System

The buoy is anchored using a fixed mooring.

The sensor string is attached to the mooring structure so sensor positions remain repeatable.

### Waterproofing Strategy

Waterproofing is achieved through:

- O-ring face seals

- Cable glands

- Waterproof connectors where required

- Passive sealing methods where practical

No electronics are intentionally exposed to seawater.

### Mechanical Design Philosophy

- Standard components whenever possible.

- Minimize custom machining.

- Serviceable construction.

- Modular replacement of failed subsystems.

- Compact packaging.

- Low mass.

- Low drag.

- Long-term corrosion resistance.

### Interfaces

#### Mechanical → Electrical

- PCB mounting

- Battery mounting

- Cable routing

- Connector access

#### Mechanical → Sensor System

- Sensor mounting

- Hydrophone mounting

- Depth spacing

- Strain relief

#### Mechanical → Power System

- Solar panel mounting

- Cable protection

- Battery restraint

The mechanical architecture is designed so that electrical and firmware revisions can occur with minimal changes to the enclosure.

For the next revision, we’ll add **Section 5: Electrical Architecture** and **Section 6: Component Selection**, which will include every selected component, why it was chosen, what alternatives were rejected, and how each component interfaces with the rest of the system.

## 5. Electrical Architecture

### Purpose

The electrical architecture provides regulated power distribution, sensor interfacing, onboard processing, local data storage, and daily wireless communication while minimizing average power consumption.

### System Philosophy

The electrical system follows four core principles:

- Only power hardware when required.

- Minimize always-on current.

- Use the fewest active components possible.

- Keep the architecture modular and serviceable.

### Power Distribution

#### Primary Energy Source

- Solar Panel

- LiFePO₄ Rechargeable Battery

#### Energy Harvesting

- **TI BQ25570**

  - Maximum Power Point Tracking (MPPT)

  - Battery charging

  - Battery protection

- 

### Voltage Rails

#### 3.3 V Rail

Generated by:

- **TI TPS62840 Buck Converter**

Supplies:

- ESP32-C3

- SX1262 LoRa Radio

- Winbond W25Q02JV Flash

- DS18B20 Temperature Sensors

- Logic circuits

- Digital interfaces

The 3.3 V rail remains active continuously.

#### 5 V Rail

Generated by:

- **TI TPS61299 Boost Converter**

Supplies:

- PCM1808 Analog Supply

- SEN0189 Turbidity Sensors

The 5 V rail is normally disabled and only enabled during measurements.

### Load Switching

High-power devices are switched using:

- **TI TPS22916 Load Switches**

Switch 1

Controls:

- Turbidity Sensors

Switch 2

Controls:

- Audio Subsystem

This minimizes standby energy consumption.

### Main Controller

#### ESP32-C3

Responsibilities:

- System scheduling

- Sensor control

- Power management

- Audio acquisition

- Flash memory management

- LoRa communications

- Error handling

- Watchdog recovery

Default state:

Deep Sleep

Operating frequency:

80 MHz

### Communication Buses

#### OneWire

Devices:

- One DS18B20 sensor (+2 field spares — ADR-0003)

#### SPI Bus

Devices:

- SX1262

- W25Q02JV

#### I²S Bus

Device:

- PCM1808

#### Analog Inputs

Devices:

- One SEN0189 turbidity sensor (+2 field spares — ADR-0003)

### Audio Interface

Hydrophone

↓

PIP Bias Network

↓

PCM1808

↓

I²S

↓

ESP32-C3

↓

Flash Memory

### Power States

#### Sleep

Powered:

- ESP32 Deep Sleep

- Flash Deep Power Down

- Regulators

Unpowered:

- Audio

- Turbidity Sensors

#### Temperature Sampling

Powered:

- ESP32

- DS18B20

#### Turbidity Sampling

Powered:

- ESP32

- TPS61299

- TPS22916

- One SEN0189 sensor (+2 field spares — ADR-0003)

#### Audio Recording

Powered:

- ESP32

- TPS61299

- TPS22916

- H2dM

- PCM1808

- Flash

#### LoRa Transmission

Powered:

- ESP32

- SX1262

## 6. Component Selection

### Component Summary

| **Function**    | **Selected Component** |
|-----------------|------------------------|
| MCU             | ESP32-C3               |
| LoRa Radio      | SX1262                 |
| MPPT Charger    | TI BQ25570             |
| 3.3 V Regulator | TI TPS62840            |
| 5 V Boost       | TI TPS61299            |
| Load Switch     | TI TPS22916 (×2)       |
| Temperature     | DS18B20 (×3)           |
| Turbidity       | DFRobot SEN0189 (×3)   |
| Hydrophone      | Aquarian H2dM          |
| Audio ADC       | TI PCM1808             |
| Storage         | Winbond W25Q02JV       |

### Component Selection Rationale

#### ESP32-C3

Chosen because:

- Extremely low sleep current

- Sufficient processing capability

- Native SPI

- Native I²S

- ADC support

- Excellent development ecosystem

- Low cost

#### SX1262

Chosen because:

- Very low receive current

- Very low sleep current

- Excellent link budget

- Supports long deployment life

- Ideal for low-data-rate telemetry

#### BQ25570

Chosen because:

- Designed specifically for energy harvesting

- Integrated MPPT

- Extremely low quiescent current

- Proven solar applications

#### TPS62840

Chosen because:

- Ultra-low quiescent current

- Excellent efficiency at light loads

- Well suited for battery-powered systems

#### TPS61299

Chosen because:

- High efficiency

- Generates required 5 V rail

- More than adequate current capability

- Enabled only when needed

#### TPS22916

Chosen because:

- Extremely low leakage

- Very low ON resistance

- Simple enable control

- Reduces standby power dramatically

#### DS18B20

Chosen because:

- Waterproof availability

- Digital output

- Excellent accuracy

- OneWire interface simplifies wiring

- Multiple sensors share one bus

#### SEN0189

Chosen because:

- Low cost

- Simple analog interface

- Suitable for proof-of-concept reef monitoring

- Easily switched off between measurements

#### Aquarian H2dM

Chosen because:

- Low-voltage operation

- No phantom power required

- Low operating current

- Simple interface

- Ideal for autonomous systems

#### PCM1808

Chosen because:

- High-quality audio conversion

- Native I²S interface

- Low design complexity

- Well documented

#### Winbond W25Q02JV

Chosen because:

- Large storage capacity

- Low standby current

- Supports approximately 30 days of onboard audio retention under the current mission profile

- Simple SPI/QSPI interface

### Alternative Components Considered

| **Original Choice** | **Final Decision** | **Reason for Change** |
|----|----|----|
| ESP32-S3 / T-Beam | ESP32-C3 | Lower power and simpler architecture |
| Aquarian H2A-XLR | Aquarian H2dM | Eliminated phantom power requirement |
| INA217 Preamp | Removed | No longer required after hydrophone change |
| 128 Mbit Flash | 2 Gbit Flash | Increased storage capacity for onboard audio |
| Continuous Sensor Power | Load-switched power | Reduced standby energy consumption |

### Component Selection Philosophy

Every component was selected using the following criteria:

1.  Lowest practical average power consumption.

2.  Minimal supporting circuitry.

3.  Long-term availability.

4.  Manufacturer documentation.

5.  Ease of integration.

6.  Proven reliability.

7.  Ability to support future expansion.

## 7. Power Architecture

### Purpose

The power architecture is designed to maximize deployment duration by minimizing average power consumption while supporting autonomous operation from a solar-charged battery system.

### Design Philosophy

The power system follows five primary principles:

- Harvest solar energy continuously.

- Keep the system in Deep Sleep whenever possible.

- Power high-current peripherals only when required.

- Minimize always-on quiescent current.

- Separate the low-power digital rail from the switched 5 V measurement rail.

### Power Flow

Solar Panel

│

▼

TI BQ25570 MPPT Energy Harvester

│

▼

LiFePO₄ Battery

│

├───────────────┐

▼ ▼

TPS62840 TPS61299

3.3 V Rail 5 V Boost

│ │

│ TPS22916 Load Switches

│ │

│ ┌──────┴────────┐

│ │ │

▼ ▼ ▼

Digital Turbidity Audio System

Electronics Sensors (PCM1808 + H2dM)

### Battery System

Battery Chemistry:

- Rechargeable LiFePO₄

Purpose:

- Supply power during nighttime and low-solar conditions.

- Provide stable energy storage for continuous operation.

Battery sizing will be determined after completion of the verified daily energy budget.

### Solar Energy Harvesting

The solar subsystem consists of:

- Solar panel

- TI BQ25570 MPPT charger

- LiFePO₄ battery

The BQ25570 continuously harvests available solar energy and charges the battery using Maximum Power Point Tracking (MPPT) to improve charging efficiency under varying sunlight conditions.

### Voltage Rails

#### 3.3 V Rail (Always Active)

Generated by:

- TI TPS62840

Supplies:

- ESP32-C3

- SX1262

- W25Q02JV

- DS18B20

- Digital logic

Characteristics:

- Always enabled

- Ultra-low quiescent current

- Primary system supply

#### 5 V Rail (Switched)

Generated by:

- TI TPS61299

Supplies:

- PCM1808 analog supply

- SEN0189 turbidity sensors

Characteristics:

- Disabled during sleep

- Enabled only for turbidity measurements and audio recording

- Controlled by firmware through TPS22916 load switches

### Power Switching Strategy

#### Always Powered

- BQ25570

- TPS62840

- ESP32-C3 (Deep Sleep)

- SX1262 (Warm Sleep)

- W25Q02JV (Deep Power-Down)

- DS18B20 (Standby)

#### Switched On-Demand

- TPS61299

- PCM1808

- Aquarian H2dM

- SEN0189 ×3

These devices are powered only during active measurements to minimize daily energy consumption.

### Protection Strategy

The architecture relies on:

- Regulated voltage rails

- Controlled power sequencing

- Load switches for high-current peripherals

- Firmware-controlled startup and shutdown

Future revisions may include additional transient and reverse-polarity protection depending on deployment requirements.

### Energy Management Philosophy

The system minimizes average power consumption by maximizing the percentage of time spent in Deep Sleep.

The firmware controls subsystem power states rather than allowing peripherals to remain continuously energized.

This approach provides significantly greater deployment duration than a continuously powered architecture.

## 8. Sensor Architecture

> ⚠️ **Superseded in part by [ADR-0003](../decisions/0003-single-point-sensing.md) (2026-08-14).**
> The build deploys **one DS18B20 and one SEN0189** at a single sensing location — not the
> 3× multi-depth string described below. Extra temp/turbidity units are field spares. The
> quantity and layout below are corrected; the step-by-step operation text still reads "all
> three" and is superseded — read it as "the sensor". Multi-depth is a future concept.

### Purpose

The sensor subsystem acquires environmental data at a single point beneath the buoy while minimizing power consumption and wiring complexity.

Three sensing modalities are included:

- Water temperature

- Water turbidity

- Underwater acoustics

### Temperature Subsystem

#### Sensor

- DS18B20 Waterproof Digital Temperature Sensor

Quantity:

- 1 deployed (2 additional units held as field spares — see ADR-0003)

Communication:

- OneWire

Supply:

- 3.3 V

Power Strategy:

- Remains powered continuously.

- Extremely low standby current makes load switching unnecessary.

Sampling Schedule:

- Six measurements per day.

Operation:

1.  ESP32 wakes.

2.  Broadcasts a single Convert-T command.

3.  The sensor performs conversion.

4.  ESP32 enters Light Sleep during conversion.

5.  ESP32 wakes.

6.  Reads each sensor sequentially.

7.  Returns to Deep Sleep.

### Turbidity Subsystem

#### Sensor

- DFRobot SEN0189

Quantity:

- 1 deployed (2 additional units held as field spares — see ADR-0003)

Interface:

- Analog

Supply:

- Switched 5 V

Power Strategy:

- Normally unpowered.

- Enabled only during measurements.

Sampling Schedule:

- Six measurements per day.

Operation:

1.  Enable TPS61299.

2.  Enable TPS22916 load switch.

3.  Apply power to the sensor.

4.  Wait 500 ms for stabilization.

5.  Read all three analog outputs.

6.  Disable sensor power.

7.  Return to Deep Sleep.

### Audio Subsystem

#### Hydrophone

- Aquarian H2dM

Interface:

- Plug-in Power (PIP)

Signal Chain:

Hydrophone

↓

PIP Bias Network

↓

PCM1808

↓

ESP32-C3 (I²S)

↓

Flash Memory

Supply:

- Switched 5 V

Sampling Configuration:

- Mono

- 16 kHz

- 16-bit PCM

Recording Schedule:

- Three recordings per day.

- 60 seconds each.

Operation:

1.  Enable TPS61299.

2.  Enable TPS22916.

3.  Power PCM1808.

4.  Bias H2dM.

5.  Begin I²S streaming.

6.  Stream audio directly into flash memory.

7.  Stop recording.

8.  Power down audio subsystem.

9.  Return to Deep Sleep.

### Sensor Layout

The deployed sensor set is (per ADR-0003):

- Temperature Sensor (DS18B20 ×1)

- Turbidity Sensor (SEN0189 ×1)

- Aquarian Hydrophone ×1

Sensors are sited together at a single point beneath the buoy. Additional DS18B20 and SEN0189 units are kept as field spares, not deployed. A future revision may distribute sensors vertically for multi-depth measurement — see [Sensor String Architecture](sensor-string-architecture.md).

### Sensor Synchronization

Temperature and turbidity measurements are synchronized so they represent approximately the same environmental conditions.

Audio recordings occur independently according to the scheduled recording windows.

This minimizes power consumption while preserving meaningful environmental datasets.

### Sensor Data Flow

Temperature

│

Turbidity

│

Hydrophone

│

▼

ESP32-C3

│

▼

Flash Memory

│

▼

Daily Summary

│

▼

SX1262 LoRa

## 9. Audio Subsystem

### Purpose

The audio subsystem continuously acquires high-quality underwater acoustic data during scheduled recording periods while minimizing average energy consumption. Raw audio is stored locally for later retrieval and analysis and is **not** transmitted over LoRa.

### Design Objectives

- Record biologically relevant reef acoustics.

- Minimize subsystem power consumption.

- Minimize analog circuitry.

- Eliminate phantom power requirements.

- Stream directly to onboard flash memory.

- Operate autonomously.

### Hardware Architecture

#### Signal Chain

Aquarian H2dM Hydrophone

│

▼

Plug-in Power (PIP) Bias Network

│

▼

TI PCM1808 Audio ADC

│

▼

I²S Digital Audio

│

▼

ESP32-C3

│

▼

Winbond W25Q02JV Flash Memory

### Components

#### Hydrophone

**Component**

- Aquarian H2dM

Purpose

- Capture underwater acoustic signals.

Reasons for Selection

- Low-voltage operation.

- No phantom power required.

- Low operating current.

- Simple interface.

- Suitable for autonomous battery-powered systems.

#### Audio ADC

**Component**

- TI PCM1808

Purpose

- Convert analog hydrophone output into digital audio.

Reasons for Selection

- Native I²S interface.

- Low design complexity.

- High audio quality.

- Well-documented implementation.

### Audio Configuration

| **Parameter**      | **Value**  |
|--------------------|------------|
| Channels           | Mono       |
| Sample Rate        | 16 kHz     |
| Bit Depth          | 16-bit PCM |
| Recording Duration | 60 seconds |
| Recordings per Day | 3          |
| Daily Raw Audio    | 5.76 MB    |

### Recording Schedule

The audio subsystem records:

- Three times per day.

- One minute per recording.

- Evenly distributed throughout the day.

The exact recording times may be modified in firmware without requiring hardware changes.

### Power Management

#### Sleep State

Powered:

- Nothing within the audio subsystem.

The hydrophone, ADC, and associated circuitry remain completely unpowered between recordings.

#### Recording State

Power sequence:

1.  Enable TPS61299 boost converter.

2.  Enable TPS22916 load switch.

3.  Power PCM1808.

4.  Apply PIP bias to H2dM.

5.  Initialize I²S.

6.  Begin recording.

Shutdown sequence:

1.  Stop I²S.

2.  Disable hydrophone bias.

3.  Power down PCM1808.

4.  Disable load switch.

5.  Disable boost converter.

### Data Handling

Audio is streamed continuously from the PCM1808 to the ESP32 using the I²S peripheral.

The ESP32 writes incoming audio directly to flash memory using small RAM buffers.

Entire recordings are **not** buffered in RAM because the recording size exceeds the available internal memory.

### Storage Strategy

Each recording is stored immediately after acquisition.

Storage characteristics:

- Sequential writes.

- Raw PCM format.

- Firmware-managed file allocation.

- Approximately 30 days of onboard storage before overwrite.

Future firmware revisions may implement compression if additional storage capacity becomes necessary.

### Failure Recovery

If power is interrupted:

- Current recording terminates.

- Previously stored recordings remain intact.

- Recording resumes at the next scheduled event.

## 10. Communications (LoRa)

### Purpose

The communications subsystem transmits summarized environmental data from the buoy to a nearby shore station once per day using LoRa.

Raw audio remains stored onboard and is not transmitted.

### Design Objectives

- Minimize transmission energy.

- Maximize communication reliability.

- Maintain simple firmware.

- Operate without acknowledgements during normal operation.

### Hardware

#### Radio

**Component**

- Semtech SX1262

Interface

- SPI

Controlled by

- ESP32-C3

### Operating Parameters

| **Parameter**    | **Value** |
|------------------|-----------|
| Frequency        | 915 MHz   |
| Transmit Power   | +14 dBm   |
| Bandwidth        | 125 kHz   |
| Spreading Factor | SF7       |
| Coding Rate      | 4/5       |
| Header           | Explicit  |
| CRC              | Enabled   |
| Preamble         | 8 symbols |

### Transmission Schedule

The buoy transmits:

- Once per day.

Transmission occurs after all daily measurements have been collected.

### Payload Structure

| **Field**                            | **Bytes**    |
|--------------------------------------|--------------|
| Timestamp                            | 4            |
| Temperature Measurements (18 values) | 36           |
| Turbidity Measurements (18 values)   | 36           |
| Battery Voltage                      | 2            |
| Status Flags                         | 1            |
| Firmware Version                     | 1            |
| CRC-16                               | 2            |
| **Total Payload**                    | **82 bytes** |

### Communication Workflow

1.  ESP32 wakes.

2.  Read summarized sensor data from flash.

3.  Wake SX1262.

4.  Configure radio.

5.  Load payload.

6.  Transmit packet.

7.  Wait for TX complete.

8.  Return SX1262 to Warm Sleep.

9.  Return ESP32 to Deep Sleep.

### Radio Power States

#### Sleep

- SX1262 Warm Sleep.

- Configuration retained.

#### Transmission

Powered:

- ESP32-C3

- SX1262

Duration:

Approximately one transmission event per day using the configured LoRa parameters.

### Shore Station

The shore station receives the daily packet and is responsible for:

- Packet validation.

- Data storage.

- Long-term archival.

- Visualization.

- Optional cloud synchronization.

- Future machine learning and anomaly detection.

### Failure Handling

If transmission fails:

- Sensor data remains stored locally.

- Firmware records the failed transmission.

- Retry behavior may be implemented in future revisions.

The current baseline architecture assumes no automatic retransmissions for the initial power budget.

## 11. Data Storage

### Purpose

The data storage subsystem provides reliable, non-volatile storage for all environmental measurements, raw hydrophone recordings, system metadata, and diagnostic information. Storage is optimized for low power consumption, sequential writes, and long deployment duration.

### Design Objectives

- Store all raw hydrophone recordings.

- Store all temperature measurements.

- Store all turbidity measurements.

- Preserve data through unexpected resets.

- Minimize write energy.

- Maximize flash lifetime.

- Simplify firmware implementation.

### Hardware

#### Primary Storage Device

| **Parameter**  | **Value**        |
|----------------|------------------|
| Component      | Winbond W25Q02JV |
| Capacity       | 2 Gbit (256 MB)  |
| Interface      | Quad SPI (QSPI)  |
| Supply Voltage | 3.3 V            |
| Default State  | Deep Power-Down  |

### Stored Data

The flash memory stores the following information:

#### Environmental Data

- Temperature measurements

- Turbidity measurements

#### Audio Data

- Raw PCM recordings

- Recording timestamps

#### System Information

- Battery voltage

- Firmware version

- System status flags

- Device configuration

- Error logs

### Storage Organization

Flash memory is logically divided into regions.

Example layout:

| **Region**           | **Purpose**                     |
|----------------------|---------------------------------|
| Boot / Configuration | Device settings                 |
| Environmental Log    | Temperature & turbidity history |
| Audio Storage        | Raw recordings                  |
| Diagnostic Log       | Errors and system events        |
| Reserved             | Future expansion                |

The exact memory map will be finalized during firmware implementation.

### Audio Storage

Configuration:

| **Parameter** | **Value** |
|---------------|-----------|
| Format        | PCM       |
| Sample Rate   | 16 kHz    |
| Bit Depth     | 16-bit    |
| Channels      | Mono      |

Generated data:

- 1.92 MB per recording

- 5.76 MB per day

- Approximately 172.8 MB over 30 days

Approximately 20% of flash capacity is reserved for metadata, wear management, erase alignment, and future expansion.

### Write Strategy

The ESP32 continuously streams incoming audio into flash using small RAM buffers.

Characteristics:

- Sequential page writes

- No full-recording RAM buffer

- Low firmware complexity

- Reduced RAM usage

- Improved flash endurance

### Read Strategy

Flash is read only when required.

Typical read operations include:

- Preparing the daily LoRa packet

- Diagnostic retrieval

- Data download during maintenance

### Storage Retention

The firmware maintains approximately 30 days of recordings under the current mission profile.

When storage becomes full, firmware will overwrite the oldest recordings using a circular buffer strategy while preserving system metadata.

### Power Management

#### Normal State

- Flash enters Deep Power-Down.

#### Recording

- Flash wakes.

- Sequential writes occur throughout recording.

- Flash returns to Deep Power-Down after recording completes.

#### Communication

- Flash wakes.

- Required summary data is read.

- Flash returns to Deep Power-Down.

### Design Constraint

#### DC-001 — Audio Storage Capacity

The selected storage device satisfies the current mission profile.

Any increase in:

- Sample rate

- Bit depth

- Recording duration

- Recordings per day

- Retention period

requires a storage capacity review.

## 12. Firmware Architecture

### Purpose

The firmware coordinates every subsystem within SCOUT while minimizing energy consumption and maintaining autonomous operation.

The firmware is event-driven and spends the majority of its lifetime in Deep Sleep.

### Primary Responsibilities

The firmware is responsible for:

- System startup

- Scheduling measurements

- Power management

- Sensor acquisition

- Audio recording

- Flash management

- LoRa communications

- Battery monitoring

- Error detection

- Watchdog recovery

### Operating Philosophy

The firmware follows one fundamental rule:

**Only power hardware that is actively performing useful work.**

Every subsystem remains unpowered whenever possible.

### System States

#### State 1 — Deep Sleep

Default operating state.

Powered:

- ESP32-C3 (Deep Sleep)

- Essential regulators

- Battery charging circuitry

Unpowered:

- Audio subsystem

- Turbidity sensors

- 5 V rail

#### State 2 — Temperature Measurement

Sequence:

1.  Wake ESP32.

2.  Issue DS18B20 Convert-T command.

3.  Enter Light Sleep during conversion.

4.  Wake.

5.  Read the sensor.

6.  Save measurements.

7.  Return to Deep Sleep.

#### State 3 — Turbidity Measurement

Sequence:

1.  Wake ESP32.

2.  Enable TPS61299.

3.  Enable TPS22916.

4.  Apply power to all SEN0189 sensors.

5.  Wait 500 ms for stabilization.

6.  Read all three analog channels.

7.  Store measurements.

8.  Disable sensor power.

9.  Return to Deep Sleep.

#### State 4 — Audio Recording

Sequence:

1.  Wake ESP32.

2.  Enable TPS61299.

3.  Enable TPS22916.

4.  Power PCM1808.

5.  Apply PIP bias to H2dM.

6.  Initialize I²S.

7.  Stream audio into flash.

8.  Stop recording.

9.  Return flash to Deep Power-Down.

10. Disable audio subsystem.

11. Return to Deep Sleep.

#### State 5 — Daily Communication

Sequence:

1.  Wake ESP32.

2.  Read summarized data from flash.

3.  Wake SX1262.

4.  Configure radio.

5.  Transmit LoRa packet.

6.  Return radio to Warm Sleep.

7.  Return ESP32 to Deep Sleep.

### Scheduler

Daily schedule:

| **Task**                 | **Frequency** |
|--------------------------|---------------|
| Temperature Measurements | 6/day         |
| Turbidity Measurements   | 6/day         |
| Audio Recordings         | 3/day         |
| LoRa Transmission        | 1/day         |

Tasks are distributed throughout the day to avoid unnecessary power peaks.

### Data Flow

Sensors

│

▼

ESP32-C3

│

├── Process measurements

├── Stream audio

├── Store data

└── Create daily summary

│

▼

SX1262 LoRa

### Error Handling

The firmware detects and records:

- Sensor read failures

- Storage errors

- Communication failures

- Low battery conditions

- Unexpected resets

All events are logged for later retrieval.

### Recovery Strategy

Upon reset:

1.  Initialize hardware.

2.  Verify flash integrity.

3.  Restore scheduler.

4.  Resume normal operation.

No user intervention is required following temporary power interruption.

### Future Firmware Enhancements

Potential future improvements include:

- OTA firmware updates

- Adaptive sampling schedules

- Audio event detection

- Data compression

- Automatic retransmissions

- Intelligent duty-cycle adjustment based on battery state

## 13. Operating Timeline

### Purpose

The operating timeline defines the sequence of events performed by SCOUT during a typical 24-hour operating cycle. The objective is to maximize time spent in low-power states while ensuring all required measurements are collected and transmitted.

### Daily Operating Philosophy

SCOUT remains in Deep Sleep for the majority of each day.

The system wakes only to:

- Measure temperature

- Measure turbidity

- Record underwater audio

- Transmit one daily LoRa packet

All other time is spent in the lowest practical power state.

### 24-Hour Operating Cycle

The exact wake times are configurable in firmware. The following timeline represents the current baseline schedule.

| **Time**       | **Event**                           |
|----------------|-------------------------------------|
| 00:00          | Temperature + Turbidity Measurement |
| 02:00          | Audio Recording                     |
| 04:00          | Temperature + Turbidity Measurement |
| 08:00          | Temperature + Turbidity Measurement |
| 10:00          | Audio Recording                     |
| 12:00          | Temperature + Turbidity Measurement |
| 16:00          | Temperature + Turbidity Measurement |
| 18:00          | Audio Recording                     |
| 20:00          | Temperature + Turbidity Measurement |
| 23:55          | Generate Daily Summary              |
| 23:56          | LoRa Transmission                   |
| Remaining Time | Deep Sleep                          |

The schedule is intentionally distributed throughout the day to capture changing environmental conditions while avoiding long periods of uninterrupted activity.

### Temperature Event Timeline

Each temperature event follows the sequence below.

1.  Wake ESP32-C3.

2.  Broadcast DS18B20 Convert-T command.

3.  ESP32 enters Light Sleep during conversion.

4.  Wake after conversion.

5.  Read the sensor.

6.  Store measurements.

7.  Return to Deep Sleep.

### Turbidity Event Timeline

Each turbidity event immediately follows the corresponding temperature event.

1.  Enable TPS61299 boost converter.

2.  Enable TPS22916 load switch.

3.  Apply power to all SEN0189 sensors.

4.  Wait for sensor stabilization.

5.  Read all three analog outputs.

6.  Store measurements.

7.  Disable sensor power.

8.  Disable boost converter.

9.  Return to Deep Sleep.

### Audio Recording Timeline

Each recording follows the same sequence.

1.  Wake ESP32-C3.

2.  Enable 5 V rail.

3.  Power PCM1808.

4.  Apply PIP bias to hydrophone.

5.  Initialize I²S.

6.  Stream audio directly to flash memory.

7.  Stop recording.

8.  Return flash to Deep Power-Down.

9.  Disable audio subsystem.

10. Return to Deep Sleep.

### Daily Communication Timeline

Once each day:

1.  Wake ESP32-C3.

2.  Read summarized environmental data.

3.  Wake SX1262.

4.  Configure LoRa radio.

5.  Transmit daily packet.

6.  Return SX1262 to Warm Sleep.

7.  Return ESP32-C3 to Deep Sleep.

### Normal Power State Summary

| **System State** | **Typical Condition**                                   |
|------------------|---------------------------------------------------------|
| Deep Sleep       | Default operating state                                 |
| Light Sleep      | During DS18B20 conversion                               |
| Active           | Sensor measurements, audio recording, LoRa transmission |

## 14. Daily Sampling Schedule

### Purpose

This section defines what data is collected, how frequently it is collected, and how it is processed before storage and transmission.

### Temperature Sampling

#### Sensor

DS18B20 Waterproof Digital Temperature Sensor

#### Quantity

3

#### Frequency

6 measurements per day per sensor

#### Daily Measurements

18 total temperature measurements

#### Workflow

- Wake MCU

- Simultaneous conversion

- Sequential read

- Save to flash

- Return to Deep Sleep

### Turbidity Sampling

#### Sensor

DFRobot SEN0189

#### Quantity

3

#### Frequency

6 measurements per day per sensor

#### Daily Measurements

18 total turbidity measurements

#### Workflow

- Enable switched 5 V rail

- Stabilize sensors

- Read analog outputs

- Save to flash

- Remove power

### Audio Sampling

#### Sensor

Aquarian H2dM

#### Quantity

1

#### Frequency

3 recordings per day

#### Recording Length

60 seconds

#### Audio Configuration

| **Parameter** | **Value**  |
|---------------|------------|
| Channels      | Mono       |
| Sample Rate   | 16 kHz     |
| Bit Depth     | 16-bit PCM |

#### Daily Audio

| **Metric**          | **Value**   |
|---------------------|-------------|
| Recordings          | 3           |
| Recording Time      | 180 seconds |
| Raw Audio Generated | 5.76 MB/day |

### Daily Data Summary

| **Data Type**        | **Daily Quantity** |
|----------------------|--------------------|
| Temperature Readings | 18                 |
| Turbidity Readings   | 18                 |
| Audio Recordings     | 3                  |
| Audio Duration       | 180 seconds        |
| LoRa Packets         | 1                  |

### Data Storage Strategy

Immediately after collection:

- Temperature data is stored in flash.

- Turbidity data is stored in flash.

- Audio is streamed directly to flash memory.

No measurement data is discarded prior to storage.

### Daily LoRa Summary Packet

The firmware constructs one packet each day containing:

- Timestamp

- Daily temperature dataset

- Daily turbidity dataset

- Battery voltage

- System status flags

- Firmware version

- CRC

Raw audio is retained onboard and is not included in the LoRa transmission.

### Mission Profile Summary

| **Parameter**        | **Value**  |
|----------------------|------------|
| Temperature Sensors  | 3          |
| Turbidity Sensors    | 3          |
| Hydrophones          | 1          |
| Temperature Samples  | 18/day     |
| Turbidity Samples    | 18/day     |
| Audio Recordings     | 3/day      |
| Audio Duration       | 180 s/day  |
| LoRa Transmissions   | 1/day      |
| Data Storage         | Continuous |
| Default System State | Deep Sleep |

### Design Philosophy

The sampling schedule balances three competing objectives:

1.  Collect sufficient environmental data to characterize reef conditions.

2.  Minimize average daily energy consumption.

3.  Maintain a simple, deterministic firmware architecture that is easy to validate, debug, and expand in future revisions.

## 15. Daily Energy Budget

### Purpose

The daily energy budget estimates the average energy consumed by SCOUT over a 24-hour period. This budget serves as the basis for battery sizing and solar panel sizing.

This version represents **Power Budget v1.0 (Preliminary)**. Electrical characteristics are derived from manufacturer documentation where available. Operating durations are based on the current firmware architecture and documented engineering assumptions.

Future prototype testing will be used to validate and refine these values.

### Methodology

For each component:

Daily Energy (Wh/day)

= Operating Voltage × Average Current × Operating Time per Day

All component energies are then summed to determine the total daily system energy consumption.

Whenever possible:

- Electrical parameters originate from manufacturer documentation.

- Operating durations originate from the firmware schedule defined in Sections 12–14.

- Engineering assumptions are explicitly documented.

### Component Energy Budget

| **Component** | **State Considered** | **Daily Energy (Wh/day)** | **Confidence** |
|----|----|----|----|
| ESP32-C3 | Active + Deep Sleep | 0.00343 | Medium (datasheet + timing assumptions) |
| SX1262 | TX + Warm Sleep | 0.000003 | Medium |
| BQ25570 | Quiescent Only | 0.000043 | High |
| DS18B20 ×3 | Active + Standby | 0.000013 | High |
| SEN0189 ×3 | Six measurement events/day | 0.000330 | Medium |
| Aquarian H2dM | Three 60-second recordings/day | 0.000210 | Medium |
| PCM1808 | Three 60-second recordings/day | 0.006000 | Medium |
| Winbond W25Q02JV | Streamed writes + daily read | 0.000110 | Medium |
| TPS62840 | Quiescent Current | 0.000005 | High |
| TPS22916 ×2 | Quiescent Current | ~0.0000001 | High |
| TPS61299 | Quiescent + switching | 0.000010 | Medium |

### Preliminary Total

| **Quantity**       | **Value**           |
|--------------------|---------------------|
| Total Daily Energy | **≈0.01015 Wh/day** |

### Largest Energy Consumers

| **Rank** | **Component** | **Approximate Contribution** |
|----|----|----|
| 1 | PCM1808 Audio ADC | ~59% |
| 2 | ESP32-C3 | ~34% |
| 3 | SEN0189 Turbidity Sensors | ~3% |
| 4 | Aquarian H2dM | ~2% |
| Remaining Components | \<2% combined |  |

### Engineering Notes

This preliminary budget highlights several important observations.

- The audio subsystem dominates total energy consumption.

- The ESP32-C3 is the second largest consumer due to continuous activity during audio recording.

- The always-on circuitry contributes only a small fraction of the total daily energy.

- Reducing audio duty cycle would have the greatest effect on deployment duration.

### Validation Plan

The following measurements should be performed on the first hardware prototype:

- Deep Sleep current

- Temperature measurement current

- Turbidity measurement current

- Audio subsystem current

- Flash write current

- LoRa transmission current

- Total daily battery current

These measurements will be used to produce **Power Budget v2.0 (Verified)**.

## 16. Battery Sizing

### Purpose

This section establishes the battery capacity required to support continuous autonomous operation under the current mission profile.

Battery sizing is based on the preliminary daily energy budget and will be refined after prototype validation.

### Battery Chemistry

Selected Battery

- Rechargeable LiFePO₄

Reasons for Selection

- Excellent cycle life

- High safety

- Stable discharge voltage

- Wide operating temperature range

- Suitable for long-duration outdoor deployment

### Design Philosophy

The battery should provide sufficient capacity to:

- Operate overnight.

- Continue operation during multiple cloudy days.

- Support all scheduled sensing events.

- Maintain adequate reserve capacity.

- Avoid deep discharge whenever practical.

### Sizing Method

Battery capacity is determined using:

Required Battery Energy

Daily Energy Consumption

×

Required Days of Autonomy

×

Safety Factor

Where:

- Daily Energy Consumption comes from Section 15.

- Days of Autonomy is determined by deployment requirements.

- Safety Factor accounts for aging, environmental conditions, and unforeseen loads.

### Current Inputs

| **Parameter**            | **Current Value**                           |
|--------------------------|---------------------------------------------|
| Daily Energy Consumption | 0.01015 Wh/day (Preliminary)                |
| Battery Chemistry        | LiFePO₄                                     |
| Battery Voltage          | To be finalized during hardware integration |
| Days of Autonomy         | To be determined                            |
| Safety Factor            | To be determined                            |

### Recommended Design Process

The battery should not be selected solely from the preliminary energy budget.

Instead:

1.  Complete prototype testing.

2.  Verify the measured daily energy consumption.

3.  Establish the required autonomy period (e.g., several consecutive low-sunlight days).

4.  Apply an appropriate engineering safety factor.

5.  Select the nearest commercially available LiFePO₄ battery exceeding the calculated requirement.

### Battery Management

The battery management strategy includes:

- Solar charging through the TI BQ25570.

- Continuous voltage monitoring by the ESP32-C3.

- Firmware-controlled low-battery detection.

- Future support for adaptive sampling if battery voltage falls below a configurable threshold.

### Future Enhancements

Potential improvements include:

- Dynamic duty cycling based on state of charge.

- Seasonal adjustment of sampling frequency.

- Adaptive audio recording schedules.

- Intelligent energy budgeting based on available solar input.

These enhancements are not required for SCOUT v1.0 but can significantly increase deployment duration in future revisions.

## 17. Solar Sizing

### Purpose

The solar subsystem replenishes the energy consumed by SCOUT each day while maintaining sufficient battery charge for continuous autonomous operation.

The solar system shall be capable of supporting normal operation under typical environmental conditions while providing adequate margin for seasonal variation, cloud cover, component aging, and conversion losses.

### Design Objectives

The solar subsystem shall:

- Fully replenish the average daily energy consumption.

- Recharge the battery after overnight operation.

- Maintain positive long-term energy balance.

- Continue operation through periods of reduced solar irradiance.

- Operate without user intervention.

### System Architecture

The solar subsystem consists of:

- Solar panel

- TI BQ25570 MPPT energy harvesting IC

- LiFePO₄ battery

- 3.3 V and 5 V regulated power rails

Energy flows continuously from the solar panel into the battery whenever sufficient sunlight is available. The battery then powers the buoy during both daylight and nighttime operation.

### Solar Energy Requirement

The current design uses the preliminary daily energy budget developed in Section 15.

| **Parameter**            | **Current Value**                |
|--------------------------|----------------------------------|
| Daily Energy Consumption | **0.01015 Wh/day (Preliminary)** |

This value will be replaced with a verified measurement after prototype testing.

### Engineering Margin

The solar panel shall be selected with significant excess capacity relative to the calculated average daily energy consumption.

Design margin should account for:

- Cloud cover

- Seasonal variation

- Panel contamination

- Battery charging losses

- Regulator efficiency

- Component aging

A practical engineering goal is for the solar panel to generate substantially more energy on an average day than the buoy consumes.

### MPPT Operation

The TI BQ25570 continuously monitors the solar input and adjusts its operating point to maximize harvested power.

Benefits include:

- Improved efficiency under varying sunlight.

- Better low-light performance.

- Increased battery charging efficiency.

- Longer deployment duration.

### Verification Plan

Prototype testing shall verify:

- Solar charging current.

- Harvested energy under representative field conditions.

- Battery state of charge over multiple days.

- System operation during prolonged cloudy weather.

- Net daily energy balance.

The measured data will be used to produce **Solar Sizing v2.0**.

## 18. Design Assumptions

### Purpose

This section documents all engineering assumptions used throughout the SCOUT design process.

Manufacturer specifications and engineering assumptions are intentionally separated to maintain traceability and simplify future design revisions.

### Firmware Assumptions

| **Item**               | **Assumption**                                     |
|------------------------|----------------------------------------------------|
| MCU Clock              | 80 MHz during active operation                     |
| Default MCU State      | Deep Sleep                                         |
| Temperature Conversion | ESP32 enters Light Sleep during DS18B20 conversion |
| Audio Storage          | Continuous streamed writes to flash                |
| Flash Buffering        | Small RAM buffers only                             |
| Radio Retries          | None                                               |
| LoRa Transmission      | One packet per day                                 |

### Sensor Assumptions

| **Item** | **Assumption** |
|----|----|
| Temperature Sensors | One DS18B20 (+2 field spares — ADR-0003) |
| Temperature Samples | Six per sensor per day |
| Turbidity Sensors | One SEN0189 (+2 field spares — ADR-0003) |
| Turbidity Samples | Six per sensor per day |
| Sensor Synchronization | Temperature and turbidity sampled during the same wake event |

### Audio Assumptions

| **Item**           | **Assumption** |
|--------------------|----------------|
| Hydrophone         | Aquarian H2dM  |
| ADC                | TI PCM1808     |
| Channels           | Mono           |
| Sample Rate        | 16 kHz         |
| Bit Depth          | 16-bit PCM     |
| Recording Duration | 60 seconds     |
| Recordings per Day | Three          |

### Storage Assumptions

| **Item**          | **Assumption**                            |
|-------------------|-------------------------------------------|
| Storage Device    | Winbond W25Q02JV                          |
| Capacity          | 256 MB                                    |
| Audio Retention   | Approximately 30 days                     |
| Storage Strategy  | Circular buffer after capacity is reached |
| Reserved Capacity | Approximately 20%                         |

### Communications Assumptions

| **Item**            | **Assumption** |
|---------------------|----------------|
| Radio               | SX1262         |
| Frequency           | 915 MHz        |
| TX Power            | +14 dBm        |
| Bandwidth           | 125 kHz        |
| Spreading Factor    | SF7            |
| Coding Rate         | 4/5            |
| Payload             | 82 bytes       |
| Daily Transmissions | One            |

### Power Assumptions

| **Item** | **Assumption** |
|----|----|
| Battery Chemistry | LiFePO₄ |
| Solar Charging | TI BQ25570 MPPT |
| 3.3 V Rail | Always enabled |
| 5 V Rail | Enabled only during turbidity measurements and audio recording |
| Turbidity Sensors | Normally unpowered |
| Audio Subsystem | Normally unpowered |

### Preliminary Design Assumptions

The following items remain preliminary until prototype validation:

- Daily energy consumption.

- Component active durations.

- Regulator efficiency under actual operating conditions.

- Flash write timing.

- Battery capacity.

- Solar panel size.

These values will be updated after laboratory testing and field validation.

### Assumption Management

Any future modification to the following parameters shall trigger a review of the power budget and system sizing:

- Sampling frequency.

- Audio recording duration.

- Sample rate.

- Bit depth.

- LoRa transmission schedule.

- Payload size.

- Storage retention period.

- Battery chemistry.

- Solar panel selection.

Maintaining this list ensures that future revisions remain traceable, repeatable, and technically defensible.

## 19. Design Constraints

### Purpose

This section documents the engineering constraints that influenced the SCOUT design. These constraints establish the boundaries within which the system must operate and identify conditions that require future design review if modified.

### Mechanical Constraints

#### Electronics Housing

- Electronics shall fit within an approximately 4-inch Schedule 40 PVC enclosure.

- Internal layout shall remain modular to simplify maintenance and future revisions.

- Components shall be securely mounted to withstand wave action and transportation.

#### Marine Environment

The buoy is intended for long-term deployment in a marine environment.

The design shall account for:

- Saltwater exposure

- Humidity

- Corrosion

- Biofouling

- UV exposure

- Temperature variation

### Electrical Constraints

#### Low Average Power

The system shall minimize average daily power consumption through aggressive power management.

This is achieved by:

- Deep Sleep as the default operating state

- Load-switching high-power peripherals

- Ultra-low quiescent current regulators

- Event-driven firmware

#### Voltage Rails

The architecture is constrained to two regulated rails:

- 3.3 V digital rail

- Switched 5 V measurement rail

Future hardware additions should utilize these rails whenever practical.

### Storage Constraint

#### DC-001 — Audio Storage Capacity

Current mission profile:

- 16 kHz

- 16-bit PCM

- Mono

- Three 60-second recordings/day

- Approximately 30-day retention

This configuration fits within the selected 256 MB flash memory.

Changes to any of the following require storage re-evaluation:

- Sample rate

- Bit depth

- Recording duration

- Number of recordings

- Retention period

### Communication Constraints

Current LoRa configuration is optimized for:

- Up to ~2 km line-of-sight range (RFM95 upper figure with a tuned antenna; real over-saltwater range with a low buoy antenna will be lower and is pending the Phase 4 measurement)

- Low energy consumption

- One transmission per day

Increasing transmission frequency or payload size will require a revised power budget.

### Firmware Constraints

The firmware architecture assumes:

- Event-driven execution

- Deterministic scheduling

- No operating system

- Sequential task execution

- No concurrent sensor acquisition

### Expandability Constraints

Future sensors may be added provided they do not exceed:

- Available GPIO

- Available flash capacity

- Battery energy budget

- Solar charging capability

- Mechanical packaging volume

Any significant subsystem addition shall trigger a review of:

- Power budget

- Battery sizing

- Solar sizing

- Mechanical layout

- Firmware scheduling

### Validation Constraints

The following sections remain preliminary until prototype testing is complete:

- Daily energy budget

- Battery sizing

- Solar sizing

- Long-term storage validation

- Environmental durability

Prototype testing shall supersede analytical estimates where discrepancies exist.

## 20. Future Improvements

### Purpose

This section identifies potential enhancements that were intentionally excluded from SCOUT v1.0 to maintain simplicity, reduce development risk, and accelerate prototype completion.

### Firmware Enhancements

Potential future firmware improvements include:

- Adaptive sampling intervals

- Battery-aware duty cycling

- Adaptive recording schedules

- Audio event detection

- Data compression

- Scheduled self-diagnostics

- Automatic fault recovery improvements

- Remote configuration through LoRa

- OTA firmware updates (if future communications architecture permits)

### Communications Enhancements

Possible future upgrades include:

- Automatic retransmissions

- Packet acknowledgements

- Downlink commands

- Remote parameter updates

- Multi-hop networking

- Mesh networking

- Increased telemetry frequency

- Compression of transmitted sensor data

### Sensor Enhancements

Potential future sensors include:

- Dissolved oxygen

- pH

- Salinity

- Conductivity

- Pressure / depth

- Light intensity (PAR)

- Chlorophyll

- Additional hydrophones

- Water velocity

- IMU for buoy motion characterization

Each additional sensor shall undergo independent review for:

- Mechanical integration

- Electrical compatibility

- Firmware complexity

- Energy consumption

### Mechanical Improvements

Potential future revisions include:

- Injection-molded enclosure components

- Improved modular sensor pods

- Enhanced cable management

- Tool-less service access

- Improved anti-biofouling features

- Alternative mooring configurations

- Integrated lifting features

- Simplified manufacturing

### Power System Improvements

Future power improvements may include:

- Higher-efficiency solar panels

- Dynamic MPPT optimization

- Larger battery options

- Additional battery monitoring

- Energy-aware scheduling

- Seasonal operating profiles

- Redundant charging paths

### Data Management Improvements

Potential future storage enhancements include:

- Lossless audio compression

- Intelligent event-based recording

- Automatic storage optimization

- Metadata indexing

- Improved diagnostic logging

- Selective audio retention

### Research Opportunities

SCOUT provides a foundation for future work in:

- Coral reef soundscape analysis

- Machine learning classification of reef health

- Long-term environmental monitoring

- Low-power autonomous marine sensing

- Distributed reef monitoring networks

- Autonomous ecological anomaly detection

### Design Philosophy for Future Revisions

Future revisions should continue to prioritize:

1.  Simplicity.

2.  Low power consumption.

3.  Modularity.

4.  Reliability.

5.  Ease of manufacturing.

6.  Ease of maintenance.

7.  Scientific usefulness.

New features should only be incorporated if they provide measurable value without significantly increasing system complexity or reducing deployment reliability.

## 21. Verification & Test Plan

### Purpose

The objective of the verification and testing phase is to validate that the SCOUT system performs as designed and that all engineering assumptions made during development are either confirmed or revised based on measured data.

Testing shall progress from individual components to fully integrated field deployments.

### Phase 1 — Electrical Bench Testing

#### Objectives

- Verify all regulated voltage rails.

- Measure quiescent current.

- Verify battery charging.

- Verify power sequencing.

- Validate all load switches.

#### Acceptance Criteria

- 3.3 V rail within regulator specification.

- 5 V rail within regulator specification.

- No excessive voltage ripple.

- All switched peripherals power on and off correctly.

- No unexpected current draw.

### Phase 2 — Sensor Validation

#### Temperature Sensors

Verify:

- Correct sensor detection.

- Temperature accuracy.

- Repeatability.

- Waterproof integrity.

#### Turbidity Sensors

Verify:

- Stable analog output.

- Repeatability.

- Power-up stabilization time.

- Response to varying turbidity.

#### Hydrophone

Verify:

- Correct bias voltage.

- Clean audio waveform.

- Noise floor.

- Frequency response.

- Recording quality.

### Phase 3 — Storage Validation

Verify:

- Flash initialization.

- Sequential write operation.

- Read reliability.

- Data integrity after reset.

- Circular buffer operation.

- Long-duration recording.

Acceptance Criteria:

- No corrupted recordings.

- No unexpected data loss.

- Continuous recording for at least the intended retention period.

### Phase 4 — Communications Testing

Verify:

- LoRa initialization.

- Successful packet transmission.

- Packet reception.

- CRC validation.

- Packet timing.

- Daily transmission scheduling.

Field Tests:

- Short-range communication.

- Line-of-sight operation.

- Real deployment environment.

### Phase 5 — Power Validation

Measure:

- Deep Sleep current.

- Temperature event current.

- Turbidity event current.

- Audio subsystem current.

- Flash write current.

- LoRa transmission current.

- Total daily battery energy consumption.

These measurements will replace the analytical estimates used in the preliminary power budget.

### Phase 6 — Mechanical Validation

Verify:

- Waterproof enclosure.

- O-ring sealing.

- Cable gland sealing.

- Structural integrity.

- Sensor mounting.

- Mooring attachment.

- Ease of assembly and service.

Environmental Tests:

- Splash testing.

- Submersion testing.

- Vibration.

- UV exposure.

- Saltwater exposure.

### Phase 7 — Integrated System Testing

Operate SCOUT continuously under representative conditions.

Verify:

- Autonomous scheduling.

- Continuous operation.

- Battery charging.

- Daily LoRa transmission.

- Correct sensor operation.

- Stable firmware.

- No unexpected resets.

### Success Criteria

The system shall be considered validated when it:

- Operates autonomously.

- Successfully collects all scheduled measurements.

- Successfully stores all required data.

- Successfully transmits the daily summary.

- Maintains positive battery energy balance under expected operating conditions.

- Completes long-duration testing without critical failures.

## 22. Complete Bill of Materials (BOM)

### Purpose

This Bill of Materials identifies the primary hardware required to construct one SCOUT prototype.

### Electronics

| **Qty** | **Component** | **Manufacturer** | **Part Number** | **Purpose** |
|----|----|----|----|----|
| 1 | Microcontroller | Espressif | ESP32-C3 | Main controller |
| 1 | LoRa Transceiver | Semtech | SX1262 | Wireless communications |
| 1 | MPPT Charger | Texas Instruments | BQ25570 | Solar charging and energy harvesting |
| 1 | 3.3 V Buck Regulator | Texas Instruments | TPS62840 | Digital power rail |
| 1 | 5 V Boost Regulator | Texas Instruments | TPS61299 | Measurement power rail |
| 2 | Load Switch | Texas Instruments | TPS22916 | Switched peripheral power |
| 1 | Audio ADC | Texas Instruments | PCM1808 | Audio digitization |
| 1 | QSPI Flash Memory | Winbond | W25Q02JV | Onboard data storage |

### Sensors

| **Qty** | **Component** | **Manufacturer** | **Part Number** | **Purpose** |
|----|----|----|----|----|
| 1 (+2 spare) | Temperature Sensor | Analog Devices / Maxim | DS18B20 | Water temperature — 1 deployed, 2 spares (ADR-0003) |
| 1 (+2 spare) | Turbidity Sensor | DFRobot | SEN0189 | Water turbidity — 1 deployed, 2 spares (ADR-0003) |
| 1 | Hydrophone | Aquarian Audio | H2dM | Underwater acoustics — part number pending ECE decision |

### Power System

| **Qty** | **Component**   | **Purpose**           |
|---------|-----------------|-----------------------|
| 1       | Solar Panel     | Primary energy source |
| 1       | LiFePO₄ Battery | Energy storage        |

### Mechanical Components

| **Qty**  | **Component**                  | **Purpose**            |
|----------|--------------------------------|------------------------|
| 1        | 4-inch Schedule 40 PVC Housing | Electronics enclosure  |
| 2        | End Caps                       | Waterproof sealing     |
| Multiple | O-rings                        | Face seals             |
| Multiple | Cable Glands                   | Waterproof cable entry |
| 1        | Float Assembly                 | Buoyancy               |
| 1        | Mooring Assembly               | Station keeping        |
| 1        | Sensor String                  | Sensor mounting        |

### Passive Components

The PCB also includes standard passive and support components, including:

- Decoupling capacitors

- Bulk capacitors

- Pull-up and pull-down resistors

- Bias resistors

- Inductors (for switching regulators)

- Crystal or oscillator (if required)

- Connectors

- Test points

- Programming header

- ESD protection (recommended)

- Reverse-polarity protection (recommended)

These components shall be selected during schematic capture based on manufacturer reference designs and PCB layout requirements.

### Procurement Notes

Whenever practical:

- Purchase components from authorized distributors.

- Match manufacturer-recommended reference designs.

- Verify package compatibility before PCB layout.

- Maintain alternate suppliers for long-lead components.

### Revision History

| **Version** | **Description** |
|----|----|
| v0.1 | Initial engineering design document generated from architecture development and design review. |
| v1.0 (Planned) | Updated after prototype construction, laboratory validation, measured power budget, battery sizing, and field testing. |

### Document Conclusion

This document defines the baseline architecture for the SCOUT autonomous reef monitoring buoy. It captures the current mechanical, electrical, firmware, sensing, storage, communications, and power-system design decisions, along with the assumptions and constraints used to reach them.

The next major milestone is prototype implementation and validation. Measured performance data will be used to refine the preliminary analytical models, replace estimated power values with experimental results, and finalize battery and solar sizing for long-duration deployment.

SCOUT v1.0 is intended to serve as a modular, low-power, and extensible platform capable of supporting future research in autonomous coral reef monitoring while providing a clear engineering foundation for future revisions.
