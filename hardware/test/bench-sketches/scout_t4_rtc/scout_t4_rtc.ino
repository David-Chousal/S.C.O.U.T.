// Test 4: PCF8523 clock on the Adalogger (I2C address 0x68). Needs the CR1220 coin cell fitted.
// Library: "RTClib" by Adafruit.
// First run sets the clock to the time this sketch was compiled (your laptop's local time).
// The buoy firmware uses UTC; set_rtc_windows.ps1 fixes that later (Test 7).
#include <RTClib.h>

RTC_PCF8523 rtc;

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 5000) {}
  if (!rtc.begin()) {
    Serial.println("RTC NOT FOUND: is the Adalogger stacked and the headers soldered?");
    while (true) {}
  }
  if (!rtc.initialized() || rtc.lostPower()) {
    Serial.println("clock was not running: setting it to compile time");
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }
  rtc.start();
}

void loop() {
  DateTime t = rtc.now();
  char s[24];
  snprintf(s, sizeof(s), "%04d-%02d-%02d %02d:%02d:%02d", t.year(), t.month(), t.day(),
           t.hour(), t.minute(), t.second());
  Serial.println(s);
  delay(1000);
}
