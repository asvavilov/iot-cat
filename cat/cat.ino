// esp-01 (gpio0, gpio2)
//#define PIN_FIRST 2
//#define PIN_SECOND 0
// esp-12
#define PIN_FIRST 5
#define PIN_SECOND 4

#include <ESP8266WiFi.h>

int timeout = 10 * 1000;

// commands:
#define CMD_PIN 1 // pin: 1|2, state: 0|1
// ...

// cmd, param1, param2, param3
#define CMD_LEN 4
byte buff_cmd[CMD_LEN];

int last_time;
byte buff_cnt;

void clean_buff() {
  for (int i = 0; i < CMD_LEN; i++) {
    buff_cmd[i] = 0;
  }
  buff_cnt = 0;
}

void start() {
  clean_buff();

  digitalWrite(PIN_FIRST, LOW);

  last_time = millis();
}

void exec() {
  switch (buff_cmd[0]) {

    case CMD_PIN:
      byte pin = 0;
      int state = -1;
      switch (buff_cmd[1]) {
        case 1:
          pin = PIN_FIRST;
          break;
        case 2:
          pin = PIN_SECOND;
          break;
      }
      switch (buff_cmd[2]) {
        case 0:
          state = LOW;
          break;
        case 1:
          state = HIGH;
          break;
      }
      if (pin > 0 && state >= 0) {
        digitalWrite(pin, state);
      }
      break;

  }

  clean_buff();
}

void setup() {
  WiFi.disconnect();
  WiFi.mode(WIFI_OFF);
  Serial.begin(9600);
  pinMode(PIN_FIRST, OUTPUT);

  start();
}

void loop() {
  if (Serial.available()) {
    while (Serial.available() > 0) {
      int b = Serial.read();
      if (buff_cmd[0] == 0 && b == 0) {
        // nop
        Serial.write(0);
        break;
      } else if (buff_cmd[0] > 0 && buff_cnt + 1 >= CMD_LEN) {
        // get full cmd with all params
        byte last_cmd = buff_cmd[0];
        exec();
        Serial.write(last_cmd);
        break;
      } else {
        // push to buffer cmd
        buff_cmd[buff_cnt] = b;
      }
      buff_cnt += 1;
    }
    last_time = millis();
  }

  // no connection
  if (last_time + timeout < millis()) {
    start();
  }
}

