// Test 3c: DS18B20 in water, hot/cold step response. Same wiring and pin as Test 3.
// Wiring: red -> 3V3, black/blue -> GND, yellow/white -> D12, 4.7 kOhm from D12 to 3V3.
// Libraries (Arduino Library Manager): "OneWire" by Paul Stoffregen,
// "DallasTemperature" by Miles Burton.
// Output is CSV, one line per second: t_s,temp_c,mark
// To mark an event, type a word in the Serial Monitor box (e.g. cold, hot, air) and press Enter;
// it appears in the mark column of the next line.
#include <OneWire.h>
#include <DallasTemperature.h>

OneWire oneWire(12);
DallasTemperature probe(&oneWire);

const unsigned long PERIOD_MS = 1000;           // 750 ms conversion at 12-bit fits inside 1 s
unsigned long t0;
unsigned long nextAt;
String mark = "";

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 5000) {}
  probe.begin();
  probe.setResolution(12);                       // 0.0625 C steps
  Serial.print("# probes found: ");
  Serial.println(probe.getDeviceCount());        // must be 1
  Serial.println("t_s,temp_c,mark");
  t0 = millis();
  nextAt = t0;
}

void loop() {
  while (Serial.available()) {
    char ch = Serial.read();
    if (ch == '\n' || ch == '\r') continue;
    if (ch == ',') ch = ' ';                     // keep the CSV columns intact
    mark += ch;
  }

  if ((long)(millis() - nextAt) < 0) return;
  nextAt += PERIOD_MS;

  float elapsed = (millis() - t0) / 1000.0;
  probe.requestTemperatures();
  float c = probe.getTempCByIndex(0);

  Serial.print(elapsed, 1);
  Serial.print(',');
  if (c == DEVICE_DISCONNECTED_C) Serial.print("NaN");   // dropout; counted in the report
  else Serial.print(c, 4);
  Serial.print(',');
  mark.trim();
  Serial.println(mark);
  mark = "";
}
