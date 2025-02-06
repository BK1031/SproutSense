#include <SPI.h>

//Radio Head Library: 
#include <RH_RF95.h>

// We need to provide the RFM95 module's chip select and interrupt pins to the 
// rf95 instance below.On the SparkFun ProRF those pins are 12 and 6 respectively.
RH_RF95 rf95(12, 6);

int LED = 13; //Status LED on pin 13

int packetCounter = 0; //Counts the number of packets sent
long timeSinceLastPacket = 0; //Tracks the time stamp of last packet received
long timeSinceLastPrint = 0;
// The broadcast frequency is set to 921.2, but the SADM21 ProRf operates
// anywhere in the range of 902-928MHz in the Americas.
// Europe operates in the frequencies 863-870, center frequency at 
// 868MHz.This works but it is unknown how well the radio configures to this frequency:
//float frequency = 864.1;
float frequency = 915.0;

void setup()
{
  pinMode(LED, OUTPUT);

  SerialUSB.begin(9600);
  SerialUSB.println("RFM Server!");

  //Initialize the Radio. 
  if (rf95.init() == false){
    SerialUSB.println("Radio Init Failed - Freezing");
    while (1);
  }
  else{
  // An LED indicator to let us know radio initialization has completed.
    SerialUSB.println("Receiver up!");
    digitalWrite(LED, HIGH);
    delay(500);
    digitalWrite(LED, LOW);
    delay(500);
  }

  rf95.setFrequency(frequency); 

 // The default transmitter power is 13dBm, using PA_BOOST.
 // If you are using RFM95/96/97/98 modules which uses the PA_BOOST transmitter pin, then 
 // you can set transmitter powers from 5 to 23 dBm:
 // rf95.setTxPower(14, false);
}

void loop()
{
  if (rf95.available()) {
    // Should be a message for us now
    uint8_t buf[RH_RF95_MAX_MESSAGE_LEN];
    uint8_t len = sizeof(buf);

    if (rf95.recv(buf, &len)){
      digitalWrite(LED, HIGH); //Turn on status LED
      timeSinceLastPacket = millis(); //Timestamp this packet

      SerialUSB.println("Received message");
      SerialUSB.print("Raw bytes: ");
      for (int i = 0; i < len; i++) {
          SerialUSB.print(buf[i], HEX);
          SerialUSB.print(" ");
      }
      SerialUSB.println();
      debug_sensor_data(buf, len);
      SerialUSB.print(" RSSI: ");
      SerialUSB.print(rf95.lastRssi(), DEC);
      SerialUSB.println();

      // Send a reply
      uint8_t toSend[] = "Hello Back!"; 
      rf95.send(toSend, sizeof(toSend));
      rf95.waitPacketSent();
      SerialUSB.println("Sent a reply");
      digitalWrite(LED, LOW); //Turn off status LED

    }
    else
      SerialUSB.println("Recieve failed");
  }
  //Turn off status LED if we haven't received a packet after 1s
  if (millis() - timeSinceLastPrint > 1000) {
    SerialUSB.print("time since last message: ");
    SerialUSB.println(millis() - timeSinceLastPacket);
    timeSinceLastPrint = millis();
  }
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
