# Electronics Bench Sketches

> **Summary** — Small Arduino sketches for the electronics bench tests (Feather M0 RFM95 +
> Adalogger). Each one checks a single part and prints to the Serial Monitor at 115200 baud.
> They are **not the flight firmware** ([`firmware/`](../../../firmware/)), but they use the same
> pins (D12 temperature, A1 turbidity, D11 turbidity switch, I²C clock and humidity, D10 SD).
> Filed 2026-11-03 so the sketches behind [RR-25](../rr-25-controller-and-sensor-bring-up-2026-10-29.md)
> and [RR-26](../rr-26-ds18b20-water-step-response-2026-11-03.md) are under version control
> (TR-001 open item OI-08).

Open a sketch's `.ino` in Arduino IDE 2, select **Adafruit Feather M0 (SAMD21)** and upload.
Libraries come from the Arduino Library Manager: OneWire (Paul Stoffregen), DallasTemperature
(Miles Burton), Adafruit SHT4x, RTClib. Test numbers are the Bench Test Plan's
([Isabella's bench plan](../../../docs/planning/isabella-bench-plan-2026-10-29.html)).

| Sketch | Test | What it does | Used in |
|---|---|---|---|
| [`scout_t1_hello`](scout_t1_hello/scout_t1_hello.ino) | 1 | Blinks the LED and prints a tick each second: the board uploads and talks | RR-25 TC-01 |
| [`scout_t3_ds18b20`](scout_t3_ds18b20/scout_t3_ds18b20.ino) | 3 | DS18B20 on D12, 12-bit, one reading every ≈ 2.75 s | RR-25 TC-02 |
| [`scout_t3_diag`](scout_t3_diag/scout_t3_diag.ino) | 3 | Reports the D12 line level and the 1-Wire presence pulse every 2 s, to find a wiring fault | RR-25 AR-01 |
| [`scout_t3b_temp_leak`](scout_t3b_temp_leak/scout_t3b_temp_leak.ino) | 3b | DS18B20 and SHT40 together, with absolute humidity, every 5 s | RR-25 TC-04 |
| [`scout_t3c_water`](scout_t3c_water/scout_t3c_water.ino) | 3c | DS18B20 once a second as CSV `t_s,temp_c,mark`; text typed over USB lands in the mark column | RR-26 |
| [`scout_t4_rtc`](scout_t4_rtc/scout_t4_rtc.ino) | 4 | PCF8523 clock on the Adalogger: sets it if stopped, prints the time each second | RR-25 TC-05 |
| [`scout_t5_sd`](scout_t5_sd/scout_t5_sd.ino) | 5 | Appends 10 lines to `T5TEST.CSV` on the microSD (CS D10) and counts them | Not run yet |
| [`scout_t6_turbidity`](scout_t6_turbidity/scout_t6_turbidity.ino) | 6, 9 | Grove turbidity on A1; commands for 50-reading stats, warm-up log, on/off toggling through Q1, supply voltage | Not run yet |
| [`scout_t11_sht40`](scout_t11_sht40/scout_t11_sht40.ino) | 11 | SHT40 temperature and humidity every 10 s, heater off | RR-25 TC-03 |

The live plot used with `scout_t3c_water` is [`../tools/live-temp-monitor.html`](../tools/live-temp-monitor.html):
open it in Edge or Chrome, close the Arduino Serial Monitor, and click **Connect**.
