/*
  Both the TX and RX ProRF boards will need a wire antenna. We recommend a 3" piece of wire.
  This example is a modified version of the example provided by the Radio Head
  Library which can be found here:
  www.github.com/PaulStoffregen/RadioHeadd
*/

#include <SPI.h>

//Radio Head Library:
#include <RH_RF95.h> 

// We need to provide the RFM95 module's chip select and interrupt pins to the
// rf95 instance below.On the SparkFun ProRF those pins are 12 and 6 respectively.
RH_RF95 rf95(12, 6);

int LED = 13; //Status LED is on pin 13

int packetCounter = 0; //Counts the number of packets sent
long timeSinceLastPacket = 0; //Tracks the time stamp of last packet received

// The broadcast frequency is set to 921.2, but the SADM21 ProRf operates
// anywhere in the range of 902-928MHz in the Americas.
// Europe operates in the frequencies 863-870, center frequency at 868MHz.
// This works but it is unknown how well the radio configures to this frequency:
//float frequency = 864.1; 
float frequency = 915.0; //Broadcast frequency

void setup()
{
  pinMode(LED, OUTPUT);

  Serial1.begin(9600); // UART communication with STM32
  SerialUSB.begin(9600);
  SerialUSB.println("RFM Client!"); 

  //Initialize the Radio.
  if (rf95.init() == false){
    SerialUSB.println("Radio Init Failed - Freezing");
    while (1);
  }
  else{
    //An LED inidicator to let us know radio initialization has completed. 
    SerialUSB.println("Transmitter up!"); 
    digitalWrite(LED, HIGH);
    delay(500);
    digitalWrite(LED, LOW);
    delay(500);
  }

  // Set frequency
  rf95.setFrequency(frequency);

   // The default transmitter power is 13dBm, using PA_BOOST.
   // If you are using RFM95/96/97/98 modules which uses the PA_BOOST transmitter pin, then 
   // you can set transmitter powers from 5 to 23 dBm:
   // Transmitter power can range from 14-20dbm.
   rf95.setTxPower(14, false);
}


void loop()
{
  uint8_t received_data[16];  // Buffer for sensor data (Module ID + 14 bytes)
  int index = 0;

  // Check if STM32 has sent data
  if (Serial1.available()) {
      while (Serial1.available() && index < sizeof(received_data)) {
          received_data[index++] = Serial1.read();
      }

      if (index == sizeof(received_data)) { // Ensure full packet received

          debug_sensor_data(received_data, sizeof(received_data));

          // Send the received binary data over LoRa
          rf95.send(received_data, sizeof(received_data));
          rf95.waitPacketSent();

          SerialUSB.println("Data sent over LoRa!");

          // Wait for reply
          byte buf[RH_RF95_MAX_MESSAGE_LEN];
          byte len = sizeof(buf);

          if (rf95.waitAvailableTimeout(2000)) {
              if (rf95.recv(buf, &len)) {
                  SerialUSB.print("Got reply: ");
                  SerialUSB.println((char*)buf);
              } else {
                  SerialUSB.println("Receive failed");
              }
          } else {
              SerialUSB.println("No reply, is the receiver running?");
          }
      } else {
          SerialUSB.println("Error: Incomplete data received");
      }
  }

  delay(500);
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
