// Test 3b: water temperature (DS18B20) + leak sensor (SHT40) together, printed to the laptop.
// Wiring: DS18B20 red -> 3V3, black/blue -> GND, yellow/white -> D12, 4.7 kOhm from D12 to 3V3.
//         SHT40 via STEMMA QT cable 4209 -> red 3V3, black GND, blue SDA, yellow SCL.
// Libraries: "OneWire" (Paul Stoffregen), "DallasTemperature" (Miles Burton),
// "Adafruit SHT4x" (installs "Adafruit Unified Sensor" and "Adafruit BusIO" too).
// Serial Monitor at 115200. Prints one CSV line every 5 s:
//   s,water_c,bay_c,bay_rh_pct,bay_abs_g_m3
// Either sensor can be missing: its columns read "nan" and the other keeps printing, so you can
// wire and check them one at a time.
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_SHT4x.h>
#include <math.h>

OneWire oneWire(12);
DallasTemperature probe(&oneWire);
Adafruit_SHT4x sht4;
bool shtOk = false;

// Absolute humidity in g/m^3 from temperature and RH (Magnus formula). The leak alarm uses this,
// because RH alone rises when a sealed bay cools even with no water getting in (Test 11 note).
float absHumidity(float tC, float rh) {
  return 6.112f * expf(17.67f * tC / (tC + 243.5f)) * rh * 2.1674f / (273.15f + tC);
}

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 5000) {}

  probe.begin();
  probe.setResolution(12);
  Serial.print("DS18B20 probes found: ");
  Serial.println(probe.getDeviceCount());        // must be 1

  shtOk = sht4.begin();
  if (shtOk) {
    sht4.setPrecision(SHT4X_HIGH_PRECISION);
    sht4.setHeater(SHT4X_NO_HEATER);
    Serial.println("SHT40 found");
  } else {
    Serial.println("SHT40 NOT FOUND: check the STEMMA QT cable and SDA/SCL");
  }

  Serial.println("s,water_c,bay_c,bay_rh_pct,bay_abs_g_m3");
}

void loop() {
  probe.requestTemperatures();
  float water = probe.getTempCByIndex(0);
  if (water == DEVICE_DISCONNECTED_C) water = NAN;

  float bayC = NAN, bayRh = NAN, bayAbs = NAN;
  if (shtOk) {
    sensors_event_t rh, t;
    sht4.getEvent(&rh, &t);
    bayC = t.temperature;
    bayRh = rh.relative_humidity;
    bayAbs = absHumidity(bayC, bayRh);
  }

  Serial.print(millis() / 1000); Serial.print(',');
  Serial.print(water, 2); Serial.print(',');
  Serial.print(bayC, 2); Serial.print(',');
  Serial.print(bayRh, 2); Serial.print(',');
  Serial.println(bayAbs, 2);
  delay(5000);
}
