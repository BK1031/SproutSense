#include <Arduino.h>
#include "ssl_client.h"
#include <WiFi.h>
//#include "ca_cert.h"

#define SerialMon Serial  //for USB communication 
#define SerialLora Serial1 //for communication with the LoRa module

const int bsid = 2;
int ticks = 0;

// wifi details
const char *ssid = "BK1031 iPhone"; 
const char *password = "pogchamp"; 

// mqtt details
const char* mqtt_server = "hamilton-ec2.gauchoracing.com";
const char* mqtt_username = "base_station"; // replace with your Username
const char* mqtt_password = "base_station"; // replace with your Password
const int mqtt_port = 1338;

#include <PubSubClient.h>

WiFiClient esp32;
PubSubClient mqtt(esp32);

// Modify the buffer declaration
#define BUFFER_SIZE 64
uint8_t loraBuffer[BUFFER_SIZE];  // Changed to uint8_t for byte array
int bufferIndex = 0;
bool has_data = false;

#define MESSAGE_END 0xFF
#define MIN_MESSAGE_LENGTH 4

#define DEBUG_MODE true

void resetBuffer() {
    for (int i = 0; i < BUFFER_SIZE; i++) {
        loraBuffer[i] = 0;
    }
    bufferIndex = 0;
}

unsigned long lastCheckTime = 0;
unsigned long byteCount = 0;
float avgBPS = 0;

void updateRollingBPS() {
    const unsigned long CHECK_INTERVAL = 1000; // Check every second
    unsigned long currentTime = millis();
    float elapsedTime = (currentTime - lastCheckTime) / 1000.0;

    if (elapsedTime >= (CHECK_INTERVAL / 1000.0)) {
        float currentBPS = byteCount / elapsedTime;
        avgBPS = (0.2 * avgBPS) + (0.8 * currentBPS);
        byteCount = 0;
        lastCheckTime = currentTime;
    }
}

void send() {
    uint8_t* message = new uint8_t[bufferIndex];
    memcpy(message, loraBuffer, bufferIndex);
    mqtt.publish(("ingest/" + String(bsid)).c_str(), message, bufferIndex);
    // Extract message id (first byte) and sid (next 2 bytes)
    uint8_t messageId = message[0];
    uint16_t sid = (message[1] << 8) | message[2];
    
    Serial.print("Forwarded message 0x0");
    Serial.print(messageId);
    Serial.print(" from sensor module ");
    Serial.print(sid);
    Serial.print(" (");
    Serial.print(bufferIndex);
    Serial.println(" bytes)");

    delete[] message;
}

void connectWifi() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi ..");
    while (WiFi.status() != WL_CONNECTED) {
        Serial.print('.');
        delay(1000);
    }
    Serial.print("connected to wifi!");
}

void reconnect() {
    connectWifi();
    while (!mqtt.connected()) {
        if (mqtt.connect(("base_station_" + String(bsid)).c_str(), mqtt_username, mqtt_password)) {
            Serial.println("connected to mqtt!");
        } else {
            Serial.print("failed, rc = ");
            Serial.print(mqtt.state());
            Serial.println(" try again in 1 second");
            delay(1000);
        }
    }
}

void setup() {
    Serial.setRxBufferSize(1024);
    Serial.begin(9600);
    delay(100);
    connectWifi();
    Serial.println(WiFi.localIP());
    mqtt.setServer(mqtt_server, mqtt_port);
    mqtt.setKeepAlive(5);
    mqtt.setBufferSize(1024);
}

void loop() {
    ticks++;

    if (!esp32.connected()) {
        Serial.println(WiFi.status());
        reconnect();
    }

    while (Serial.available() && bufferIndex < BUFFER_SIZE) {
        uint8_t incoming = Serial.read();
        byteCount++;
        
        // Store the character
        loraBuffer[bufferIndex] = incoming;
        bufferIndex++;
        
        // Check if we got the end character and have enough data
        if (incoming == MESSAGE_END && bufferIndex >= MIN_MESSAGE_LENGTH) {
            has_data = true;
            break;
        }
    }

    if (has_data) {
        if (DEBUG_MODE) {
            Serial.print("Received ");
            Serial.print(bufferIndex);
            Serial.println(" bytes!");
            for (int i = 0; i < bufferIndex; i++) {
                Serial.print("0x");
                if (loraBuffer[i] < 0x10) {
                    Serial.print("0");
                }
                Serial.print(loraBuffer[i], HEX);
                Serial.print(" ");
            }
            Serial.println();
        }

        send();
        has_data = false;
        resetBuffer();
    }

    updateRollingBPS();
    if (ticks % 1000 == 0) {
        Serial.print("Average BPS: ");
        Serial.println(avgBPS);
    }

    mqtt.loop();   
}