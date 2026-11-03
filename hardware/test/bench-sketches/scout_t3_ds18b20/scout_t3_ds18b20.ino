// Test 3: DS18B20 water-temperature probe on D12 (same pin as the buoy firmware).
// Wiring: red -> 3V3, black/blue -> GND, yellow/white -> D12, 4.7 kOhm from D12 to 3V3.
// Libraries (Arduino Library Manager): "OneWire" by Paul Stoffregen,
// "DallasTemperature" by Miles Burton.
#include <OneWire.h>
#include <DallasTemperature.h>

OneWire oneWire(12);
DallasTemperature probe(&oneWire);

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 5000) {}
  probe.begin();
  probe.setResolution(12);                       // 0.0625 C steps, 750 ms per reading
  Serial.print("probes found: ");
  Serial.println(probe.getDeviceCount());        // must be 1
}

void loop() {
  probe.requestTemperatures();
  float c = probe.getTempCByIndex(0);
  if (c == DEVICE_DISCONNECTED_C) {
    Serial.println("NO PROBE (-127): check the yellow wire and the 4.7k pull-up");
  } else {
    Serial.print("temp_c=");
    Serial.println(c, 2);
  }
  delay(2000);
}
