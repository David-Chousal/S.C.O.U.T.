// Test 11: SHT40 humidity + temperature (leak sensor, SCO-60 / SCO-204). I2C address 0x44.
// Wiring: STEMMA QT cable 4209 -> red 3V3, black GND, blue SDA, yellow SCL.
// Library: "Adafruit SHT4x" (installs "Adafruit Unified Sensor" and "Adafruit BusIO" too).
// Prints one CSV line every 10 s: seconds,temp_c,rh_pct. Copy the Serial Monitor output into
// the calibration table, or log it to a file with the PlatformIO monitor.
#include <Adafruit_SHT4x.h>

Adafruit_SHT4x sht4;

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 5000) {}
  if (!sht4.begin()) {
    Serial.println("SHT40 NOT FOUND: check the STEMMA QT cable and SDA/SCL");
    while (true) {}
  }
  sht4.setPrecision(SHT4X_HIGH_PRECISION);
  sht4.setHeater(SHT4X_NO_HEATER);            // heater off: it would dry the air it measures
  Serial.println("s,temp_c,rh_pct");
}

void loop() {
  sensors_event_t rh, t;
  sht4.getEvent(&rh, &t);
  Serial.print(millis() / 1000); Serial.print(',');
  Serial.print(t.temperature, 2); Serial.print(',');
  Serial.println(rh.relative_humidity, 2);
  delay(10000);
}
