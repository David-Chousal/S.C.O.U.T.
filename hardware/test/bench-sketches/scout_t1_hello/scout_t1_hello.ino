// Test 1: is the Feather alive and talking? Blinks the red LED (D13) and prints once a second.
// Board: Adafruit Feather M0 (SAMD21). Serial Monitor at 115200 baud.
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(115200);
  while (!Serial && millis() < 5000) {}   // wait up to 5 s for the Serial Monitor
  Serial.println("hello from the Feather M0");
}

void loop() {
  static uint32_t n = 0;
  digitalWrite(LED_BUILTIN, n % 2);
  Serial.print("tick ");
  Serial.println(n++);
  delay(1000);
}
