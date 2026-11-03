// Test 3 diagnostic: why can't the Feather find the DS18B20 on D12?
// Prints two facts every 2 s:
//   line   = the data wire's level with nothing driving it. HIGH means the 4.7 kOhm pull-up
//            reaches D12. LOW means the data wire is pulled to ground somewhere.
//   answer = whether any 1-Wire chip answers a reset (the "presence pulse").
// Board: Adafruit Feather M0 (SAMD21). Serial Monitor at 115200 baud. Library: "OneWire".
#include <OneWire.h>

OneWire bus(12);

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 5000) {}
  Serial.println("DS18B20 diagnostic on D12");
}

void loop() {
  pinMode(12, INPUT);                 // let the pull-up set the level
  delay(5);
  int line = digitalRead(12);
  uint8_t present = bus.reset();      // 1 = a chip answered

  Serial.print("line=");
  Serial.print(line ? "HIGH" : "LOW");
  Serial.print("  answer=");
  Serial.print(present ? "YES" : "NO");

  if (line == LOW) {
    Serial.println("  -> data wire stuck LOW: pull-up not reaching D12, or data touching ground");
  } else if (!present) {
    Serial.println("  -> pull-up OK, but no chip answers: data wire not reaching the probe, or probe has no power");
  } else {
    byte addr[8];
    bus.reset_search();
    if (bus.search(addr)) {
      Serial.print("  -> found chip, ID ");
      for (int i = 0; i < 8; i++) { if (addr[i] < 16) Serial.print('0'); Serial.print(addr[i], HEX); }
      Serial.println(addr[0] == 0x28 ? " (DS18B20)" : " (not a DS18B20?)");
    } else {
      Serial.println("  -> something answers but the ID can't be read: weak connection");
    }
  }
  delay(2000);
}
