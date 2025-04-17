#include <Arduino.h>
#include "ssl_client.h"
#include <WiFi.h>
//#include "ca_cert.h"

#define SerialMon Serial  //for USB communication 
#define SerialLora Serial1 //for communication with the LoRa module

const int bsid = 2;

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

int lastByteReceiveTime = 0;

#define MAX_SEND_DELAY 2000

#define MESSAGE_END 0xFF
#define MIN_MESSAGE_LENGTH 8

// Message type definitions - add your actual message types here
#define MESSAGE_ONE 0x01
#define MESSAGE_TWO 0x02
#define MESSAGE_THREE 0x03
#define MESSAGE_FOUR 0x04
// Add other message types as needed

// Function to get expected message length based on message type (first byte)
int getExpectedMessageLength(uint8_t messageType) {
    switch (messageType) {
        case MESSAGE_ONE:
            return 13;
        case MESSAGE_TWO:
            return 19;
        case MESSAGE_THREE:
            return 23;
        case MESSAGE_FOUR:
            return 33;
        default:
            return MIN_MESSAGE_LENGTH;  // Default minimum length for unknown types
    }
}

#define DEBUG_MODE true

#include <time.h>

// Add these constants after other const declarations
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = -28800;  // PST offset (-8 hours * 3600 seconds)
const int   daylightOffset_sec = 3600;  // 1 hour DST offset

void printLocalTime() {
    struct tm timeinfo;
    struct timeval tv;
    if(!getLocalTime(&timeinfo)){
        Serial.println("Failed to obtain time");
        return;
    }
    gettimeofday(&tv, NULL);
    
    // Print the main time components
    Serial.print(&timeinfo, "%A, %B %d %Y %H:%M:%S");
    // Print milliseconds
    Serial.printf(".%03d", (tv.tv_usec / 1000));
    Serial.println();
}

void resetBuffer() {
    for (int i = 0; i < BUFFER_SIZE; i++) {
        loraBuffer[i] = 0;
    }
    bufferIndex = 0;
}

int getBufferSize() {
    int size = 0;
    for (int i = 0; i < BUFFER_SIZE; i++) {
        if (loraBuffer[i] != 0) {
            size++;
        }
    }
    return size;
}

unsigned long lastCheckTime = 0;
unsigned long byteCount = 0;
float avgBPS = 0;

unsigned long lastPrintTime = 0;  // Add this with other global variables

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
    
    // Configure NTP
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    
    // Wait for time to be set
    Serial.println("Waiting for NTP time sync...");
    while (time(nullptr) < 1000000000) {
        Serial.print(".");
        delay(100);
    }
    Serial.println("\nTime synchronized!");
}

void loop() {
    if (!esp32.connected()) {
        Serial.println(WiFi.status());
        reconnect();
    }

    while (Serial.available() && bufferIndex < BUFFER_SIZE) {
        uint8_t incoming = Serial.read();
        byteCount++;
        lastByteReceiveTime = millis();
        
        // Store the character
        loraBuffer[bufferIndex] = incoming;
        bufferIndex++;

        // Send raw byte
        // mqtt.publish(("ingest/" + String(bsid) + "/debug").c_str(), &incoming, 1);

        if (bufferIndex == 1 && incoming == MESSAGE_END) {
            resetBuffer();
            mqtt.publish(("ingest/" + String(bsid) + "/debug").c_str(), "initial 0xFF, reset buffer", true);
            continue;
        }
        
        // Get expected message length based on the first byte (message type)
        int expectedLength = MIN_MESSAGE_LENGTH;
        if (bufferIndex > 0) {
            expectedLength = getExpectedMessageLength(loraBuffer[0]);
            // mqtt.publish(("ingest/" + String(bsid) + "/debug").c_str(), ("expecting length: " + String(expectedLength)).c_str(), true);
        }
        
        // Check if we've reached the expected length AND found the end marker
        if (incoming == MESSAGE_END && bufferIndex >= expectedLength) {
            // Only consider it a complete message if we've reached the expected length
            mqtt.publish(("ingest/" + String(bsid) + "/debug").c_str(), "reached expected length, publishing data", true);
            has_data = true;
            break;
        }

        // buffer overflow, clear and take the data loss
        if (bufferIndex >= BUFFER_SIZE) {
            mqtt.publish(("ingest/" + String(bsid) + "/debug").c_str(), "buffer overflow, reset buffer", true);
            resetBuffer();
            has_data = false;
        }
    }

    if (has_data) {
        send();
        has_data = false;
        resetBuffer();

        uint8_t response[5] = {'1', '2', '3', '4', '5'};
        Serial.write(response, 5);
    }

    // If no data has been received for a while and buffer is not empty (partial or pending message), reset the buffer
    int buffer_size = getBufferSize();
    if (buffer_size > 0 && millis() - lastByteReceiveTime >= MAX_SEND_DELAY) {
        resetBuffer();
        mqtt.publish(("ingest/" + String(bsid) + "/debug").c_str(), ("non-empty buffer (" + String(buffer_size) + " bytes) timeout, reset buffer").c_str(), true);
    }
    

    updateRollingBPS();
    
    if (millis() - lastPrintTime >= 2000) {
        lastPrintTime = millis();

        char bps_str[16];
        snprintf(bps_str, sizeof(bps_str), "Avg BPS: %.2f", avgBPS);
        mqtt.publish(("ingest/" + String(bsid) + "/bps").c_str(), bps_str, strlen(bps_str));
    }

    mqtt.loop();
}