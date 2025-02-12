/*
  Both the TX and RX ProRF boards will need a wire antenna. We recommend a 3" piece of wire.
  This example is a modified version of the example provided by the Radio Head
  Library which can be found here:
  www.github.com/PaulStoffregen/RadioHeadd
*/

#include <SPI.h>
#include <RH_RF95.h> 

// We need to provide the RFM95 module's chip select and interrupt pins to the
// rf95 instance below.On the SparkFun ProRF those pins are 12 and 6 respectively.
RH_RF95 rf95(12, 6);

int LED = 13; // Status LED is on pin 13

int packetCounter = 0; // Counts the number of packets sent
long timeSinceLastPacket = 0; // Tracks the time stamp of last packet received

// The default broadcast frequency is set to 915.0, but the SADM21 ProRf operates
// anywhere in the range of 902-928MHz in the Americas.
float frequency = 915.0;

// Transmitter power can range from 14-20dbm.
int power = 14;

void setup() {
    pinMode(LED, OUTPUT);

    Serial1.begin(9600); // UART communication baud rate
    SerialUSB.begin(9600);
    SerialUSB.println("LoRa Module");

    // Initialize the radio
    if (rf95.init() == false) {
    SerialUSB.println("LoRa Initialization Failed - Halting");
    while (1);
    }
    else{
    // LED indicator to let us know radio initialization has completed
    SerialUSB.println("LoRa Module Active"); 
    for (int i = 0; i < 4; i++) {
        digitalWrite(LED, HIGH);
        delay(250);
        digitalWrite(LED, LOW);
        delay(250);
    }
    }

    rf95.setFrequency(frequency);
    rf95.setTxPower(power, false);
}

void loop()
{
  
}


void debug_sensor_data(uint8_t *data, size_t length) {
    if (length < 16) {  // Module ID (2B) + Sensor Data (14B)
        SerialUSB.println("Debug Error: Invalid data length");
        return;
    }

    SerialUSB.println("====== DEBUG ======");

    // Extract Module ID (First 2 Bytes)
    uint16_t module_id = (data[0] << 8) | data[1];

    // Extract Sensor Values
    uint8_t temperature = data[2];       // 1 Byte
    uint8_t humidity = data[3];          // 1 Byte
    uint16_t nitrogen = (data[4] << 8) | data[5];      // 2 Bytes
    uint16_t phosphorus = (data[6] << 8) | data[7];    // 2 Bytes
    uint16_t potassium = (data[8] << 8) | data[9];     // 2 Bytes
    uint32_t soil_moisture = (data[10] << 24) | (data[11] << 16) | (data[12] << 8) | data[13]; // 4 Bytes
    uint16_t uv = (data[14] << 8) | data[15];          // 2 Bytes

    // Print Debug Info
    SerialUSB.print("Module ID: ");
    SerialUSB.println(module_id);
    SerialUSB.print("Temperature: ");
    SerialUSB.println(temperature);
    SerialUSB.print("Humidity: ");
    SerialUSB.println(humidity);
    SerialUSB.print("Nitrogen: ");
    SerialUSB.println(nitrogen);
    SerialUSB.print("Phosphorus: ");
    SerialUSB.println(phosphorus);
    SerialUSB.print("Potassium: ");
    SerialUSB.println(potassium);
    SerialUSB.print("Soil Moisture: ");
    SerialUSB.println(soil_moisture);
    SerialUSB.print("UV: ");
    SerialUSB.println(uv);
    SerialUSB.println("====== ====== ======");
}