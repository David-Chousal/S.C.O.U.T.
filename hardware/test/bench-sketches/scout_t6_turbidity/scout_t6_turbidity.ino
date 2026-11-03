// Test 6 + Test 9: Grove turbidity sensor on A1, optional power switch Q1 on D11 (LOW = ON).
// Wiring (Grove cable): red -> 3V3 (or Q1 drain once Q1 is built), black -> GND,
// yellow -> A1, white -> not used (cut and tape it). Board switch on "A" (analog).
// Serial Monitor at 115200, line ending "Newline". Type a letter and press Enter:
//   s = 50 readings: mean, min, max, spread %  (pass: spread < 1 %)
//   w = warm-up log: switch the sensor off 2 s, on, log A1 every 10 ms for 2 s (needs Q1)
//   t = toggle the sensor on/off every 5 s, 6 times (for current and rail-dip checks, needs Q1)
//   b = battery/supply voltage on A7 (onboard divider, x2)
const int PIN_TURB = A1;
const int PIN_GATE = 11;   // P-FET gate: LOW = sensor ON, HIGH = OFF (100k pull-up holds it OFF)
const int PIN_BAT = A7;

float volts(int raw) { return raw * 3.3f / 4095.0f; }

void sensorOn(bool on) { digitalWrite(PIN_GATE, on ? LOW : HIGH); }

void stats() {
  long sum = 0; int mn = 4095, mx = 0;
  for (int i = 0; i < 50; i++) {
    int r = analogRead(PIN_TURB);
    sum += r; if (r < mn) mn = r; if (r > mx) mx = r;
    delay(20);
  }
  float mean = sum / 50.0f;
  Serial.print("mean="); Serial.print(mean, 1);
  Serial.print(" ("); Serial.print(volts(mean), 3); Serial.print(" V) min="); Serial.print(mn);
  Serial.print(" max="); Serial.print(mx);
  Serial.print(" spread%="); Serial.println(mean > 0 ? 100.0f * (mx - mn) / mean : 0, 2);
}

void warmup() {
  sensorOn(false); delay(2000);
  uint32_t t0 = millis();
  sensorOn(true);
  Serial.println("ms,adc");
  for (int i = 0; i <= 200; i++) {            // 0 to 2000 ms in 10 ms steps
    while (millis() - t0 < (uint32_t)i * 10) {}
    Serial.print(millis() - t0); Serial.print(','); Serial.println(analogRead(PIN_TURB));
  }
  Serial.println("settle time = first ms where adc stays within 1 % of the final value");
}

void toggle() {
  for (int i = 0; i < 6; i++) {
    bool on = (i % 2 == 0);
    sensorOn(on);
    Serial.print(on ? "ON  " : "OFF "); Serial.println(analogRead(PIN_TURB));
    delay(5000);
  }
  sensorOn(true);
}

void setup() {
  pinMode(PIN_GATE, OUTPUT);
  sensorOn(true);
  analogReadResolution(12);
  Serial.begin(115200);
  while (!Serial && millis() < 5000) {}
  Serial.println("turbidity test: type s, w, t or b");
}

void loop() {
  if (Serial.available()) {
    char c = Serial.read();
    if (c == 's') stats();
    else if (c == 'w') warmup();
    else if (c == 't') toggle();
    else if (c == 'b') { Serial.print("BAT/VBUS = "); Serial.print(volts(analogRead(PIN_BAT)) * 2, 3); Serial.println(" V"); }
  }
  static uint32_t last = 0;
  if (millis() - last > 1000) {
    last = millis();
    int r = analogRead(PIN_TURB);
    Serial.print("adc="); Serial.print(r); Serial.print("  V="); Serial.println(volts(r), 3);
  }
}
