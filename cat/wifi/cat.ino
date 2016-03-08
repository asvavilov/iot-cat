// see config.example.h
#include "./config.h"

#include <ESP8266WiFi.h>

#if SECURE
#include <WiFiClientSecure.h>
#endif

const unsigned long period = 10L * 1000L; // FIXME 30
unsigned long lastConnectionTime = 0;

int status = WL_IDLE_STATUS;

//WiFiClientSecure client;
WiFiClient client;

bool clientVerify() {
#if SECURE
  return client.verify(FINGERPRINT, HOST)
#else
  return true;
#endif
}

void httpRequest() {
  client.stop();

  if (client.connect(HOST, PORT)) {
    if (clientVerify()) {
      Serial.println("connecting...");

      client.print("GET ");
      client.print(PATH);
      client.println(" HTTP/1.1");

      client.print("Host: ");
      client.println(HOST);
      client.println("User-Agent: ESP8266/Arduino");
      client.println("Connection: close");
      client.println();
    } else {
      Serial.println("certificate doesn't match");
    }
    lastConnectionTime = millis();
  } else {
    Serial.println("connection failed");
  }
}

// esp-01 (gpio0, gpio2)
//#define PIN_FIRST 2
//#define PIN_SECOND 0
// esp-12
#define PIN_FIRST 4
#define PIN_SECOND 5

void setup() {
  Serial.begin(9600);

  // FIXME tmp for debug
  //while (!Serial) ;

  Serial.println();

  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(SSID_NAME);
    status = WiFi.begin(SSID_NAME, SSID_PASS);
    delay(10000);
  }

  pinMode(PIN_SECOND, OUTPUT);
  digitalWrite(PIN_SECOND, HIGH);

  pinMode(PIN_FIRST, OUTPUT);
  digitalWrite(PIN_FIRST, LOW);

}

void loop() {
  String line;
  while (client.connected()) {
    line = client.readStringUntil('\n');
    if (line == "\r") {
      Serial.println("headers received");
      break;
    }
  }
  if (client.available()) {
    line = client.readStringUntil('\n');
    Serial.println("line: ");
    Serial.println(line);

    if (line == "1") {
      digitalWrite(PIN_SECOND, LOW);
      digitalWrite(PIN_FIRST, HIGH);
    } else {
      digitalWrite(PIN_SECOND, HIGH);
      digitalWrite(PIN_FIRST, LOW);
    }
  }

  /*while (client.available()) {
    char c = client.read();
    Serial.write(c);
    }*/

  if (millis() - lastConnectionTime > period) {
    httpRequest();
  }

}
