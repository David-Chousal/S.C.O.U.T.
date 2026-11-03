// Test 5: microSD on the Adalogger. Chip select = D10 (same as the buoy firmware).
// Card must be FAT32 (the Adafruit 128 MB card is). Library: "SD" (built in).
#include <SPI.h>
#include <SD.h>

const int SD_CS = 10;
const int RADIO_CS = 8;   // the LoRa radio shares the SPI bus: keep it deselected

void setup() {
  pinMode(RADIO_CS, OUTPUT);
  digitalWrite(RADIO_CS, HIGH);
  Serial.begin(115200);
  while (!Serial && millis() < 5000) {}
  if (!SD.begin(SD_CS)) {
    Serial.println("SD FAILED: card in? pushed until it clicks? FAT32?");
    while (true) {}
  }
  File f = SD.open("T5TEST.CSV", FILE_WRITE);   // appends if it exists
  if (!f) { Serial.println("could not open T5TEST.CSV"); while (true) {} }
  for (int i = 0; i < 10; i++) {
    f.print(millis()); f.print(','); f.println(i);
  }
  f.close();

  f = SD.open("T5TEST.CSV");
  int lines = 0;
  while (f.available()) { if (f.read() == '\n') lines++; }
  f.close();
  Serial.print("PASS if this grows by 10 each reset. lines in T5TEST.CSV = ");
  Serial.println(lines);
}

void loop() {}
