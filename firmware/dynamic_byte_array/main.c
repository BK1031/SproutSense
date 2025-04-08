/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Main program body
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2025 STMicroelectronics.
  * All rights reserved.
  *
  * This software is licensed under terms that can be found in the LICENSE file
  * in the root directory of this software component.
  * If no LICENSE file comes with this software, it is provided AS-IS.
  *
  ******************************************************************************
  */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */

#include "TSL2591.h"
#include <stdio.h>
#include <stdlib.h>

/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */
#define FLAG_UV          0b00000001  // 0x01
#define FLAG_TEMP        0b00000010  // 0x02
#define FLAG_HUMIDITY    0b00000100  // 0x04
#define FLAG_N           0b00001000  // 0x08
#define FLAG_P           0b00010000  // 0x10
#define FLAG_K           0b00100000  // 0x20
#define FLAG_SOIL        0b01000000  // 0x40
#define FLAG_GPS         0b10000000  // 0x80

#define N_Ticks 2
//#define N_Ticks 1
//Phosphorus  every 2 timer interrupts, so once every 4 hours
#define P_Ticks 3
#define K_Ticks 2


#define TSL2591_ADDR             (0x29 << 1) // 7-bit address shifted for 8-bit I2C format
#define TSL2591_REG_ENABLE       0x00
#define TSL2591_REG_CONTROL      0x01
#define TSL2591_REG_C0DATAL      0x14
#define TSL2591_ENABLE_POWER_ON  0x01  // Power ON bit
#define TSL2591_ENABLE_ALS       0x02  // ALS Enable bit
#define TSL2591_CONTROL_GAIN_MED 0x10  // Medium gain
#define TSL2591_CONTROL_IT_300MS 0x02  // 300ms integration time
#define TSL2591_I2C_ADDRESS  0x29 << 1

#define GPS_BUFFER_SIZE 72
#define PMTK_RESET "$PMTK104*37\r\n"
#define PMTK_NONE "$PMTK010,000*2F\r\n"
#define PMTK_SET_NMEA_OUTPUT_RMCONLY "$PMTK314,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0*29\r\n"
//#define SENSOR_READ_DELAY 700000000
#define SENSOR_READ_DELAY 1000




/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/*
 *
 * Schedule for reading sensor data:


	Every 30 mins:

		Temp/Hum and UV


	Every 1 hour:

		Nitrogen

	Every 2 hours:

		either Phosphorus or Potassium

	Every 24 hours:
		GPS



Potential Sizes for Dyanamic Byte Array:

Case 1: Temp/Hum and UV

sensor id - temp - hum - uv

Case 2: Temp/Hum, UV, Nitrogen

sensor id - temp - hum - uv - nitrogen

Case 3: Temp/Hum, UV, Nitrogen, Phosphorus or Potassium

sensor id - temp - hum - uv - nitrogen - P or K - identifier for p or k

Case 4: sensor id - temp - hum - uv - nitrogen - gps - P or K - identifier for p or k


In order for this to be feasible I have to see if I can read different NPK values in different interrupts at the same time
 */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/
ADC_HandleTypeDef hadc1;

I2C_HandleTypeDef hi2c1;

RTC_HandleTypeDef hrtc;

TIM_HandleTypeDef htim2;
TIM_HandleTypeDef htim3;
TIM_HandleTypeDef htim5;

UART_HandleTypeDef huart1;
UART_HandleTypeDef huart2;
UART_HandleTypeDef huart3;
DMA_HandleTypeDef hdma_usart1_rx;
DMA_HandleTypeDef hdma_usart1_tx;
DMA_HandleTypeDef hdma_usart3_rx;
DMA_HandleTypeDef hdma_usart3_tx;

/* USER CODE BEGIN PV */

volatile uint8_t new_data_flags = 0;

uint16_t MODULE_ID = 4;
uint8_t sensor_data[14];  // Buffer to hold sensor data

//for this case we need 4 bytes, temp/hum need one each, and uv is two byes
uint8_t CASE_1_IDENTIFIER = 1;
uint8_t CASE_2_IDENTIFIER = 2;
uint8_t CASE_3_IDENTIFIER = 3;
uint8_t CASE_4_IDENTIFIER = 4;

uint8_t sensor_data_case_1[12];
uint8_t sensor_data_case_2[18];
uint8_t sensor_data_case_3[22];
uint8_t sensor_data_case_4[32];

// Example sensor readings
uint8_t temperature ;   // 25°C
uint8_t humidity;      // 60%
uint16_t nitrogen = 300;    // 300 mg/kg
uint16_t phosphorus = 154;  // 150 mg/kg
uint16_t potassium = 206;   // 200 mg/kg
//uint32_t soil_moisture = 123456; // Example soil moisture value
uint16_t uv = 47;          // UV index 45


uint32_t adc_value;
float voltage;
float soil_moisture;
char moisture[60];


int currNTicks = 0;
int currPTicks = 0;
int currKTicks = 0;

int p_or_k_toggle = 0;


uint8_t txBuffer[8];
uint8_t rxBuffer[7] = {0};
volatile uint16_t nitrogen_value;
volatile uint16_t phosphorus_value;
volatile uint16_t potassium_value;
volatile uint8_t current_sensor = 0; // 0 = N, 1 = P, 2 = K


TSL2591 tslSensor;
char lux_buffer[50];
uint16_t ch0_data, ch1_data;
float integration_time = 300.0;
float lux, ratio, cpl;
uint8_t gain = 25;  // Example gain multiplier
float lux = 0;


uint8_t gpsBuffer[GPS_BUFFER_SIZE];
uint32_t latitude = 34419210;
uint32_t longitude = 119865878;

uint8_t north_or_south = 0; // 0 = North, 1 = South
uint8_t east_or_west = 1;   // 0 = East, 1 = West

uint32_t millis = 0;



int rtc_mins = 2;

int retry_publish = 0;


/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_DMA_Init(void);
static void MX_USART2_UART_Init(void);
static void MX_USART1_UART_Init(void);
static void MX_TIM2_Init(void);
static void MX_TIM5_Init(void);
static void MX_USART3_UART_Init(void);
static void MX_ADC1_Init(void);
static void MX_I2C1_Init(void);
static void MX_RTC_Init(void);
static void MX_TIM3_Init(void);
/* USER CODE BEGIN PFP */

/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */
unsigned long lastCheckTime = 0;
unsigned long byteCount = 0;
float avgBPS = 0;

void countBytesInBuffer(uint8_t *buffer, uint16_t len) {
    char cntBuffer[50];

    for (uint16_t i = 0; i < len; i++) {

    	if(buffer[i] != 0){
    		byteCount += 1;
    	}
    }

    sprintf(cntBuffer, "cnt = %d\r\n", byteCount);
    HAL_UART_Transmit(&huart2, (uint8_t*)cntBuffer, strlen(cntBuffer), HAL_MAX_DELAY);

//    strcat(uartLine, "\r\n");  // Line ending for Termite
//    HAL_UART_Transmit(&huart2, (uint8_t*)uartLine, strlen(uartLine), HAL_MAX_DELAY);
}

void updateRollingBPS() {
//	switch this out for its own dedicated buffer on the pcb version of the projecty(
	HAL_UART_Receive_DMA(&huart1, gpsBuffer, 72);
	HAL_Delay(300);
	countBytesInBuffer(gpsBuffer, 72);
	memset(gpsBuffer, 0, 72);
    const unsigned long CHECK_INTERVAL = 1000; // Check every second
    unsigned long currentTime = HAL_GetTick();
    float elapsedTime = (currentTime - lastCheckTime) / 1000.0;
    char bpsBuffer[50];

    if (elapsedTime >= (CHECK_INTERVAL / 1000.0)) {
        float currentBPS = byteCount / elapsedTime;
        avgBPS = (0.2 * avgBPS) + (0.8 * currentBPS);
        byteCount = 0;
        lastCheckTime = currentTime;
    }

    sprintf(bpsBuffer, "avgBPS = %.2f\r\n", avgBPS);  // Format with 2 decimal places
    HAL_UART_Transmit(&huart2, (uint8_t*)bpsBuffer, strlen(bpsBuffer), HAL_MAX_DELAY);
}

HAL_StatusTypeDef NPK_ReadSensor_DMA(void) {
    uint8_t comN[] = {0x01, 0x03, 0x00, 0x1E, 0x00, 0x01, 0xE4, 0x0C};
    memcpy(txBuffer, comN, 8);

    return HAL_UART_Transmit_DMA(&huart3, txBuffer, 8);
}

HAL_StatusTypeDef Phosphorus_ReadSensor_DMA(void) {
    uint8_t ComP[] = { 0x01, 0x03, 0x00, 0x1F, 0x00, 0x01, 0xB5, 0xCC };
    memcpy(txBuffer, ComP, 8);

    return HAL_UART_Transmit_DMA(&huart3, txBuffer, 8);
}

HAL_StatusTypeDef Potassium_ReadSensor_DMA(void) {
    uint8_t ComK[] = { 0x01, 0x03, 0x00, 0x20, 0x00, 0x01, 0x85, 0xC0 };
    memcpy(txBuffer, ComK, 8);

    return HAL_UART_Transmit_DMA(&huart3, txBuffer, 8);
}

uint16_t read_tsl2591_data(I2C_HandleTypeDef *hi2c, uint8_t reg_low, uint8_t reg_high) {
    uint8_t data_bytes[2];
    uint16_t data;

    // Read low and high bytes in one go
    HAL_I2C_Mem_Read(hi2c, TSL2591_I2C_ADDRESS, TSL2591_COMMAND_BIT | reg_low, I2C_MEMADD_SIZE_8BIT, data_bytes, 2, HAL_MAX_DELAY);

    // Combine bytes
    data = (data_bytes[1] << 8) | data_bytes[0];

    return data;
}

float calculateSoilScore(float volt){
	float score = 0;
	float num = 0;
	if(volt >= 0.0 && volt < 1.1){
		num = volt*10 - 1;
	}
	else if(volt >= 1.1 && volt < 1.3){
		num = volt*25 - 17.5;
	}
	else if(volt >= 1.3 && volt < 1.82){
		num = volt*48.08 - 47.5;
	}
	else if(volt >= 1.82 && volt <= 2.2){
		num = volt*26.32- 7.89;
	}
	else{
		// out of range
		num = -1;
	}
	score = num/50;
	return score;
}

uint8_t response[4];
void StartUartDmaReceive(void) {
	HAL_UART_Receive_DMA(&huart1, gpsBuffer, 72);
//	HAL_UART_Receive_DMA(&huart1, response, 4);
    HAL_UART_Receive_DMA(&huart3, rxBuffer, 7);
}

void HAL_UART_TxCpltCallback(UART_HandleTypeDef *huart) {
    if (huart == &huart3) {
        HAL_UART_Receive_DMA(&huart3, rxBuffer, 7);
    }
}



void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart) {
    if (huart == &huart3) {

		uint16_t received_value = (rxBuffer[3] << 8) | rxBuffer[4];

		switch(current_sensor) {
			case 0:
				nitrogen_value = received_value;
				break;
			case 1:
				phosphorus_value = received_value;
				break;
			case 2:
				potassium_value = received_value;
				break;
		}
		HAL_UART_Receive_DMA(&huart3, rxBuffer, 7);
    }
}

float calcLux(uint16_t ch0_data, uint16_t ch1_data){
    if (ch0_data == 0) {
        lux = 0.0f; // Avoid divide-by-zero
    } else {
        float ratio = (float)ch1_data / (float)ch0_data;

        // Calculate CPL
        float cpl = (integration_time * gain) / 408.0;

        // Determine lux based on ratio thresholds
        if (ratio <= 0.5) {
            lux = ((0.0304 * ch0_data) - (0.062 * ch0_data * powf(ratio, 1.4))) / cpl;
        } else if (ratio <= 0.61) {
            lux = ((0.0224 * ch0_data) - (0.031 * ch1_data)) / cpl;
        } else if (ratio <= 0.80) {
            lux = ((0.0128 * ch0_data) - (0.0153 * ch1_data)) / cpl;
        } else if (ratio <= 1.30) {
            lux = ((0.00146 * ch0_data) - (0.00112 * ch1_data)) / cpl;
        } else {
            lux = 0.0f; // Very high ratio indicates invalid reading
        }
    }
    return lux;

}




void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim) {
	if(htim->Instance == TIM2) {
//		in the actual project we would first read the data from the sensors, right after getting the reading we would set the flags
		  currNTicks += 1;
		  if(currNTicks == N_Ticks){
			  current_sensor = 0;
			  new_data_flags |= FLAG_N;
			  currNTicks = 0;

			  HAL_ADC_Start(&hadc1);

			  HAL_ADC_PollForConversion(&hadc1, HAL_MAX_DELAY);

			  adc_value = HAL_ADC_GetValue(&hadc1);
			  voltage = (adc_value * 3.3f) / 4095.0f;

			  soil_moisture = calculateSoilScore(voltage) * 100;

			  sprintf(moisture,"Voltage: %.2f V, Soil Moisture Level: %.1f / 100\r\n", voltage, soil_moisture);
			  HAL_UART_Transmit(&huart2, (uint8_t*)moisture, strlen(moisture), 1000);
			  new_data_flags |= FLAG_SOIL;
		  }

		  ch0_data = read_tsl2591_data(&hi2c1, 0x14, 0x15);
		  ch1_data = read_tsl2591_data(&hi2c1, 0x16, 0x17);
		  lux = calcLux( ch0_data,  ch1_data);
		  sprintf(lux_buffer,"Lux is: %.1f \r\n", lux);
		  HAL_UART_Transmit(&huart2, (uint8_t*)lux_buffer, strlen(lux_buffer), HAL_MAX_DELAY);

		  new_data_flags |= FLAG_TEMP;
		  new_data_flags |= FLAG_HUMIDITY;
		  new_data_flags |= FLAG_UV;


//		  char message[50];
//	      snprintf(message, sizeof(message), "TEMP/HUMIDITY Data Ready\r\n");
//	      HAL_UART_Transmit(&huart2, (uint8_t*)message, strlen(message), HAL_MAX_DELAY);

//		  parseGNRMC((const char*)gpsBuffer);
//		  HAL_UART_Transmit(&huart2, gpsBuffer, strlen((char*)gpsBuffer), 1000);
	}

	if(htim->Instance == TIM5) {

	    new_data_flags |= FLAG_P;
	    new_data_flags |= FLAG_K;

//	    char message[50];
//	    snprintf(message, sizeof(message), "NPK Interrupt\r\n");
//	    HAL_UART_Transmit(&huart2, (uint8_t*)message, strlen(message), HAL_MAX_DELAY);
	}


}

void create_dynamic_sensor_payload_case(void) {
//	millis are used for all transmission cases
    millis = HAL_GetTick();

	if(new_data_flags == 0b00000111){
		char message[50];
	    snprintf(message, sizeof(message), "Case 1 Triggered\r\n");
	    HAL_UART_Transmit(&huart2, (uint8_t*)message, strlen(message), HAL_MAX_DELAY);
	    sensor_data_case_1[0] = CASE_1_IDENTIFIER;
		sensor_data_case_1[1] = (millis >> 24) & 0xFF;
		sensor_data_case_1[2] = (millis >> 16) & 0xFF;
		sensor_data_case_1[3] = (millis >> 8) & 0xFF;
		sensor_data_case_1[4] = millis & 0xFF;
	    sensor_data_case_1[5] = temperature;
	    sensor_data_case_1[6] = humidity;
	    sensor_data_case_1[7] = (ch0_data >> 8) & 0xFF;
	    sensor_data_case_1[8] = ch0_data & 0xFF;
	    sensor_data_case_1[9] = (ch1_data >> 8) & 0xFF;
		sensor_data_case_1[10] = ch1_data & 0xFF;
		sensor_data_case_1[11] = 0xFF;

		char buffer[50]; // Enough space to hold formatted output
		int len = snprintf(buffer, sizeof(buffer),
		                   "Data: %02X %02X %02X %02X %02X %02X %02X %02X\r\n",
		                   sensor_data_case_1[0], sensor_data_case_1[1], sensor_data_case_1[2], sensor_data_case_1[3],
		                   sensor_data_case_1[4], sensor_data_case_1[5], sensor_data_case_1[6], sensor_data_case_1[7]);

		HAL_UART_Transmit(&huart2, (uint8_t*)buffer, len, 1000);
//		HAL_UART_Transmit(&huart2, sensor_data_case_1, sizeof(sensor_data_case_1), 1000);


	}else if(new_data_flags == 0b01001111) {

		char message[50];
	    snprintf(message, sizeof(message), "Case 2 Triggered\r\n");
	    HAL_UART_Transmit(&huart2, (uint8_t*)message, strlen(message), HAL_MAX_DELAY);
	  	sensor_data_case_2[0] = CASE_2_IDENTIFIER;
		sensor_data_case_2[1] = (millis >> 24) & 0xFF;
		sensor_data_case_2[2] = (millis >> 16) & 0xFF;
		sensor_data_case_2[3] = (millis >> 8) & 0xFF;
		sensor_data_case_2[4] = millis & 0xFF;
		sensor_data_case_2[5] = temperature;
		sensor_data_case_2[6] = humidity;
		sensor_data_case_2[7] = (ch0_data >> 8) & 0xFF;
		sensor_data_case_2[8] = ch0_data & 0xFF;
		sensor_data_case_2[9] = (ch1_data >> 8) & 0xFF;
		sensor_data_case_2[10] = ch1_data & 0xFF;
		sensor_data_case_2[11] = (nitrogen_value >> 8) & 0xFF;
		sensor_data_case_2[12] = nitrogen_value & 0xFF;
		sensor_data_case_2[13] = (adc_value >> 24) & 0xFF;
		sensor_data_case_2[14] = (adc_value >> 16) & 0xFF;
		sensor_data_case_2[15] = (adc_value >> 8) & 0xFF;
		sensor_data_case_2[16] = adc_value & 0xFF;
		sensor_data_case_2[17] = 0xFF;

		char buffer[100];  // Sufficient space for formatted output
		int len = snprintf(buffer, sizeof(buffer),
		                   "Data: %02X %02X %02X %02X %02X %02X %02X %02X "
		                   "%02X %02X %02X %02X %02X %02X\r\n",
		                   sensor_data_case_2[0], sensor_data_case_2[1], sensor_data_case_2[2], sensor_data_case_2[3],
		                   sensor_data_case_2[4], sensor_data_case_2[5], sensor_data_case_2[6], sensor_data_case_2[7],
		                   sensor_data_case_2[8], sensor_data_case_2[9], sensor_data_case_2[10], sensor_data_case_2[11],
		                   sensor_data_case_2[12], sensor_data_case_2[13]);

		HAL_UART_Transmit(&huart2, (uint8_t*)buffer, len, HAL_MAX_DELAY);





	}else if(new_data_flags == 0b01111111) {
		char message[50];
	    snprintf(message, sizeof(message), "Case 3 Triggered\r\n");
	    HAL_UART_Transmit(&huart2, (uint8_t*)message, strlen(message), HAL_MAX_DELAY);

		sensor_data_case_3[0] = CASE_3_IDENTIFIER;
		sensor_data_case_3[1] = (millis >> 24) & 0xFF;
		sensor_data_case_3[2] = (millis >> 16) & 0xFF;
		sensor_data_case_3[3] = (millis >> 8) & 0xFF;
		sensor_data_case_3[4] = millis & 0xFF;
		sensor_data_case_3[5] = temperature;
		sensor_data_case_3[6] = humidity;
		sensor_data_case_3[7] = (ch0_data >> 8) & 0xFF;
		sensor_data_case_3[8] = ch0_data & 0xFF;
		sensor_data_case_3[9] = (ch1_data >> 8) & 0xFF;
		sensor_data_case_3[10] = ch1_data & 0xFF;
		sensor_data_case_3[11] = (nitrogen_value >> 8) & 0xFF;
		sensor_data_case_3[12] = nitrogen_value & 0xFF;
		sensor_data_case_3[13] = (adc_value >> 24) & 0xFF;
		sensor_data_case_3[14] = (adc_value >> 16) & 0xFF;
		sensor_data_case_3[15] = (adc_value >> 8) & 0xFF;
		sensor_data_case_3[16] = adc_value & 0xFF;
		sensor_data_case_3[17] = (phosphorus_value >> 8) & 0xFF;
		sensor_data_case_3[18] = phosphorus_value & 0xFF;
		sensor_data_case_3[19] = (potassium_value >> 8) & 0xFF;
		sensor_data_case_3[20] = potassium_value & 0xFF;
		sensor_data_case_3[21] = 0xFF;


		char buffer[150];  // Large enough for formatted output
		int len = snprintf(buffer, sizeof(buffer),
		                   "Data: %02X %02X %02X %02X %02X %02X %02X %02X "
		                   "%02X %02X %02X %02X %02X %02X %02X %02X %02X %02X\r\n",
		                   sensor_data_case_3[0], sensor_data_case_3[1], sensor_data_case_3[2], sensor_data_case_3[3],
		                   sensor_data_case_3[4], sensor_data_case_3[5], sensor_data_case_3[6], sensor_data_case_3[7],
		                   sensor_data_case_3[8], sensor_data_case_3[9], sensor_data_case_3[10], sensor_data_case_3[11],
		                   sensor_data_case_3[12], sensor_data_case_3[13], sensor_data_case_3[14], sensor_data_case_3[15],
		                   sensor_data_case_3[16], sensor_data_case_3[17]);
		HAL_UART_Transmit(&huart2, (uint8_t*)buffer, len, HAL_MAX_DELAY);
//		HAL_UART_Transmit(&huart2, sensor_data_case_3, sizeof(sensor_data_case_3), 1000);
	}else if(new_data_flags == 0b11111111){

		char message[50];
	    snprintf(message, sizeof(message), "Case 4 Triggered\r\n");
	    HAL_UART_Transmit(&huart2, (uint8_t*)message, strlen(message), HAL_MAX_DELAY);

		sensor_data_case_4[0] = CASE_4_IDENTIFIER;
		sensor_data_case_4[1] = (millis >> 24) & 0xFF;
		sensor_data_case_4[2] = (millis >> 16) & 0xFF;
		sensor_data_case_4[3] = (millis >> 8) & 0xFF;
		sensor_data_case_4[4] = millis & 0xFF;
		sensor_data_case_4[5] = temperature;
		sensor_data_case_4[6] = humidity;
		sensor_data_case_4[7] = (ch0_data >> 8) & 0xFF;
		sensor_data_case_4[8] = ch0_data & 0xFF;
		sensor_data_case_4[9] = (ch1_data >> 8) & 0xFF;
		sensor_data_case_4[10] = ch1_data & 0xFF;
		sensor_data_case_4[11] = (nitrogen_value >> 8) & 0xFF;
		sensor_data_case_4[12] = nitrogen_value & 0xFF;
		sensor_data_case_4[13] = (adc_value >> 24) & 0xFF;
		sensor_data_case_4[14] = (adc_value >> 16) & 0xFF;
		sensor_data_case_4[15] = (adc_value >> 8) & 0xFF;
		sensor_data_case_4[16] = adc_value & 0xFF;
		sensor_data_case_4[17] = (phosphorus_value >> 8) & 0xFF;
		sensor_data_case_4[18] = phosphorus_value & 0xFF;
		sensor_data_case_4[19] = (potassium_value >> 8) & 0xFF;
		sensor_data_case_4[20] = potassium_value & 0xFF;
		sensor_data_case_4[21] = (latitude >> 24) & 0xFF;
		sensor_data_case_4[22] = (latitude >> 16) & 0xFF;
		sensor_data_case_4[23] = (latitude >> 8) & 0xFF;
		sensor_data_case_4[24] = latitude & 0xFF;
		sensor_data_case_4[25] = north_or_south;
		sensor_data_case_4[26] = (longitude >> 24) & 0xFF;
		sensor_data_case_4[27] = (longitude >> 16) & 0xFF;
		sensor_data_case_4[28] = (longitude >> 8) & 0xFF;
		sensor_data_case_4[29] = longitude & 0xFF;
		sensor_data_case_4[30] = east_or_west;
		sensor_data_case_4[31] = 0xFF;


		char buffer[200];
		int len = snprintf(buffer, sizeof(buffer),
		                   "Data: %02X %02X %02X %02X %02X %02X %02X %02X %02X %02X "
		                   "%02X %02X %02X %02X %02X %02X %02X %02X %02X %02X %02X %02X "
		                   "%02X %02X %02X %02X %02X %02X\r\n",
		                   sensor_data_case_4[0], sensor_data_case_4[1], sensor_data_case_4[2], sensor_data_case_4[3],
		                   sensor_data_case_4[4], sensor_data_case_4[5], sensor_data_case_4[6], sensor_data_case_4[7],
		                   sensor_data_case_4[8], sensor_data_case_4[9], sensor_data_case_4[10], sensor_data_case_4[11],
		                   sensor_data_case_4[12], sensor_data_case_4[13], sensor_data_case_4[14], sensor_data_case_4[15],
		                   sensor_data_case_4[16], sensor_data_case_4[17], sensor_data_case_4[18], sensor_data_case_4[19],
		                   sensor_data_case_4[20], sensor_data_case_4[21], sensor_data_case_4[22], sensor_data_case_4[23],
		                   sensor_data_case_4[24], sensor_data_case_4[25], sensor_data_case_4[26], sensor_data_case_4[27]);

		HAL_UART_Transmit(&huart2, (uint8_t*)buffer, len, HAL_MAX_DELAY);

	}
}

void create_dynamic_sensor_payload(uint8_t *buffer) {

	if(new_data_flags & FLAG_UV) {
		buffer[12] = (uv >> 8) & 0xFF;
		buffer[13] = uv & 0xFF;
	}

	if(new_data_flags & FLAG_TEMP) {
		buffer[0] = temperature;

	}

	if(new_data_flags & FLAG_HUMIDITY) {
		buffer[1] = humidity;
	}

	if(new_data_flags & FLAG_N) {
		buffer[2] = (nitrogen >> 8) & 0xFF;
		buffer[3] = nitrogen & 0xFF;
	}

	if(new_data_flags & FLAG_P) {
		buffer[4] = (phosphorus >> 8) & 0xFF;
		buffer[5] = phosphorus & 0xFF;
	}

	if(new_data_flags & FLAG_K) {
		buffer[6] = (potassium >> 8) & 0xFF;
		buffer[7] = potassium & 0xFF;
	}

//	if(new_data_flags & FLAG_SOIL) {
//		buffer[8]  = (soil_moisture >> 24) & 0xFF;
//		buffer[9]  = (soil_moisture >> 16) & 0xFF;
//		buffer[10] = (soil_moisture >> 8) & 0xFF;
//		buffer[11] = soil_moisture & 0xFF;
//	}


}

void create_sensor_payload(uint8_t temperature, uint8_t humidity,
                           uint16_t nitrogen, uint16_t phosphorus, uint16_t potassium,
                           uint32_t soil_moisture, uint16_t uv,
                           uint8_t *buffer) {
    buffer[0] = temperature;
    buffer[1] = humidity;

    buffer[2] = (nitrogen >> 8) & 0xFF;
    buffer[3] = nitrogen & 0xFF;

    buffer[4] = (phosphorus >> 8) & 0xFF;
    buffer[5] = phosphorus & 0xFF;

    buffer[6] = (potassium >> 8) & 0xFF;
    buffer[7] = potassium & 0xFF;

    buffer[8]  = (soil_moisture >> 24) & 0xFF;
    buffer[9]  = (soil_moisture >> 16) & 0xFF;
    buffer[10] = (soil_moisture >> 8) & 0xFF;
    buffer[11] = soil_moisture & 0xFF;

    buffer[12] = (uv >> 8) & 0xFF;
    buffer[13] = uv & 0xFF;
}


uint8_t *published_buffer = NULL;

void retry_publish_sensor_data(uint8_t *data) {
	if(retry_publish <= 3){
		if(avgBPS < 1){
			HAL_UART_Transmit(&huart1, data, sizeof(data), HAL_MAX_DELAY);
			retry_publish = 0;
		}
	}else{
		retry_publish = 0;
	}
}

void publish_sensor_data(uint16_t module_id, uint8_t *data, size_t length) {
	uint8_t buffer[length + 2];  // Create a new buffer with space for the module ID
	buffer[0] = data[0];
	buffer[1] = (module_id >> 8) & 0xFF;  // High byte of module_id
	buffer[2] = module_id & 0xFF;         // Low byte of module_id

	memcpy(&buffer[3], &data[1], length - 1);  // Copy sensor data after module ID

//	check abg bps here, if under thereshold then we send
// else preserve message and set some retry flag, which is read in main, then we directly return here to try again
//	rolling bps runs every second whithin our while loop in main

	if(avgBPS < 1){
		HAL_UART_Transmit(&huart1, buffer, sizeof(buffer), HAL_MAX_DELAY);
		retry_publish = 0;

	}else{
//		set some retry flag
		retry_publish += 1;
		if(published_buffer != NULL){
			free(published_buffer);
		}

		published_buffer = malloc(length + 2);

		if (published_buffer != NULL) {
			memcpy(published_buffer, buffer, length + 2);
		}
	}

	memset(data, 0, length);
	new_data_flags = 0;
}

void uv_init(void){
	  if (TSL2591_Init(&tslSensor, &hi2c1) == HAL_OK) {
			if (TSL2591_Enable(&tslSensor) != HAL_OK) {

			}

			if (TSL2591_SetIntegrationGain(&tslSensor, TSL2591_INTEGRATIONTIME_300MS, TSL2591_GAIN_MED) == HAL_OK) {
				HAL_Delay(300);
			}
	  }
}

uint8_t TermiteBuffer[256];


float convertGNRMCLatLonToDecimal(const char *coord){

	float result = strtof(coord, NULL); // Convert string to float

	return result;

}


void parseGNRMC(const char *nmeaBuffer) {
    // Temporary buffer to avoid modifying the original string
    char buffer[256];
    strncpy(buffer, nmeaBuffer, sizeof(buffer));
    buffer[sizeof(buffer) - 1] = '\0'; // Ensure null termination

    // Split the buffer by commas
    char *tokens[20]; // NMEA sentences typically have fewer than 20 fields
    int index = 0;
    char *token = strtok(buffer, ",");

    // Tokenize the sentence
    while (token != NULL && index < 20) {
        tokens[index++] = token;
        token = strtok(NULL, ",");
    }

    // Check if the sentence is $GNRMC
    for (int i = 0; i < index; i++) {
        if (strcmp(tokens[i], "$GNRMC") == 0 || strcmp(tokens[i], "$$GNRMC")) {
            int latIndex = i + 3; // Latitude value
            int latDirIndex = i + 4; // Latitude direction
            int lonIndex = i + 5; // Longitude value
            int lonDirIndex = i + 6; // Longitude direction

            // Extract latitude and longitude with their directions
            const char *latitude_char = tokens[latIndex];
            const char *latDirection_char = tokens[latDirIndex];
            const char *longitude_char = tokens[lonIndex];
            const char *lonDirection_char = tokens[lonDirIndex];

            float latitude_float = convertGNRMCLatLonToDecimal(latitude_char);
            float longitude_float = convertGNRMCLatLonToDecimal(longitude_char);

            latitude = (uint32_t)(latitude_float * 10000);
            longitude = (uint32_t)(longitude_float * 10000);

            if(latDirection_char[0] == 'N'){
            	north_or_south = 0;
            }else{
            	north_or_south = 1;
            }


            if(longitude_char[0] == 'E'){
            	east_or_west = 0;
            }else{
            	east_or_west = 1;
            }

            snprintf(TermiteBuffer, sizeof(TermiteBuffer),
                     "Lat: %lu, Dir: %u, Lon: %lu, Dir: %u\n",
                     latitude, north_or_south, longitude, east_or_west);

            // Transmit via UART2
            HAL_UART_Transmit(&huart2, (uint8_t*)TermiteBuffer, strlen(TermiteBuffer), 1000);

//
//            snprintf(TermiteBuffer, sizeof(TermiteBuffer), "Lat: %lu, Lon: %lu\n", latitude, longitude);
//            HAL_UART_Transmit(&huart2, (uint8_t*)TermiteBuffer, strlen(TermiteBuffer), 1000);
//
//            // Transmit via UART2
//            HAL_UART_Transmit(&huart2, (uint8_t*)TermiteBuffer, strlen(TermiteBuffer), 1000);

            // Use sprintf to format into TermiteBuffer
//            snprintf((char*)TermiteBuffer, sizeof(TermiteBuffer),
//                     "Lat: %s %s, Lon: %s %s\n",
//					 latitude_char, latDirection_char, longitude_char, lonDirection_char);
//
//            // Transmit via UART2
//            HAL_UART_Transmit(&huart2, TermiteBuffer, strlen((char*)TermiteBuffer), 1000);

            return; // Exit after processing the first $GNRMC sentence
        }
    }

    // If no $GNRMC sentence found
//    snprintf((char*)TermiteBuffer, sizeof(TermiteBuffer), "No $GNRMC sentence found.\n");
//    HAL_UART_Transmit(&huart2, TermiteBuffer, strlen((char*)TermiteBuffer), 1000);

    HAL_UART_Transmit(&huart2, TermiteBuffer, strlen((char*)gpsBuffer), 1000);

}

void gps_init(void){
//	try transmitting this to a different uart, if doesnt work, switch the gps to use uart 3 and the npk will use uart1
	HAL_UART_Transmit(&huart3, (uint8_t*)PMTK_RESET, strlen(PMTK_RESET), 1000);
    HAL_Delay(1000);
    HAL_UART_Transmit(&huart1, (uint8_t*)PMTK_SET_NMEA_OUTPUT_RMCONLY, strlen(PMTK_SET_NMEA_OUTPUT_RMCONLY), 1000);
    HAL_Delay(1000);
    HAL_UART_Transmit(&huart1, (uint8_t*)PMTK_NONE, strlen(PMTK_NONE), 1000);
    HAL_Delay(1000);
}


void Set_RTC_Alarm(int mins)
{
    RTC_AlarmTypeDef sAlarm = {0};
    uint8_t buffer[3];


//    HAL_UART_Transmit(&huart2, (uint8_t*)"Enter Alarm Hours (00-23): ", 27, HAL_MAX_DELAY);
//    UART_Receive(buffer, 2);
    sAlarm.AlarmTime.Hours = 0;

//    HAL_UART_Transmit(&huart2, (uint8_t*)"\n\rEnter Alarm Minutes (00-59): ", 30, HAL_MAX_DELAY);
//    UART_Receive(buffer, 2);
    sAlarm.AlarmTime.Minutes = mins;

    sAlarm.AlarmTime.Seconds = 0;

    sAlarm.AlarmTime.SubSeconds = 0;
    sAlarm.AlarmTime.DayLightSaving = RTC_DAYLIGHTSAVING_NONE;
    sAlarm.AlarmTime.StoreOperation = RTC_STOREOPERATION_RESET;
    sAlarm.AlarmMask = RTC_ALARMMASK_NONE;
    sAlarm.AlarmSubSecondMask = RTC_ALARMSUBSECONDMASK_ALL;
    sAlarm.AlarmDateWeekDaySel = RTC_ALARMDATEWEEKDAYSEL_DATE;
    sAlarm.AlarmDateWeekDay = 0x01;
    sAlarm.Alarm = RTC_ALARM_A;

    if (HAL_RTC_SetAlarm_IT(&hrtc, &sAlarm, RTC_FORMAT_BIN) != HAL_OK)
    {
        Error_Handler();
    }
    HAL_UART_Transmit(&huart2, (uint8_t*)"\n\rAlarm is set!\n\r", 17, HAL_MAX_DELAY);
}

void HAL_RTC_AlarmAEventCallback(RTC_HandleTypeDef *hrtc) {
//    Bring this back
//	  parseGNRMC((const char*)gpsBuffer);
//	  HAL_UART_Transmit(&huart2, gpsBuffer, strlen((char*)gpsBuffer), 1000);
	  new_data_flags |= FLAG_GPS;
	  rtc_mins += 2;
	  Set_RTC_Alarm(rtc_mins);
}

#define DHT11_PIN GPIO_PIN_8
#define DHT11_GPIO_PORT GPIOA

typedef struct {
    uint8_t temperature;
    uint8_t humidity;
} DHT_Data;


void delay_us(uint16_t us){
//	swap to tim3
	__HAL_TIM_SET_COUNTER(&htim3, 0);
//	HAL_TIM_Base_Start(&htim2);
	while (__HAL_TIM_GET_COUNTER(&htim3) < us);
//	HAL_TIM_Base_Stop(&htim2);

}

DHT_Data readDHT(void){
	uint8_t data[5] = {0};
	DHT_Data dht_data = {0, 0};
	int i, j;

	HAL_GPIO_WritePin(DHT11_GPIO_PORT, DHT11_PIN, GPIO_PIN_RESET);
	HAL_Delay(18);

	HAL_GPIO_WritePin(DHT11_GPIO_PORT, DHT11_PIN, GPIO_PIN_SET);


	delay_us(30);


	GPIO_InitTypeDef GPIO_InitStruct = {0};
	GPIO_InitStruct.Pin = DHT11_PIN;
	GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
	GPIO_InitStruct.Pull = GPIO_NOPULL;
	HAL_GPIO_Init(DHT11_GPIO_PORT, &GPIO_InitStruct);

	uint32_t timeout = 10000;
	    while (HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_PIN) == GPIO_PIN_SET) {
	        if (--timeout == 0){
	        	return dht_data;
	        }
	    }

	    delay_us(80);

	    timeout = 1000;
	    while (HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_PIN) == GPIO_PIN_RESET) {
	        if (--timeout == 0) {
	        	return dht_data;
	        }
	    }

	    delay_us(80);



	 for (i = 0; i < 5; i++) {
	         for (j = 7; j >= 0; j--) {
	             while (HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_PIN) == GPIO_PIN_RESET);

	             delay_us(30);
	             if (HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_PIN) == GPIO_PIN_SET) {
	                 data[i] |= (1 << j);
	             }
	             while (HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_PIN) == GPIO_PIN_SET);
	         }
	 }
	 if ((data[0] + data[1] + data[2] + data[3]) == data[4]) {
	         dht_data.humidity = data[0];
	         dht_data.temperature = data[2];
	}

	 GPIO_InitStruct.Pin = DHT11_PIN;
	 GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
	 GPIO_InitStruct.Pull = GPIO_NOPULL;
	 HAL_GPIO_Init(DHT11_GPIO_PORT, &GPIO_InitStruct);
	return dht_data;
}

DHT_Data readAndTransmitDHT(void) {
	DHT_Data sensorData = readDHT();
	char msg[50];
    if (sensorData.humidity > 0 || sensorData.temperature > 0) {
	    sprintf(msg, "Humidity: %d%%, Temperature: %u°C\r\n", sensorData.humidity, sensorData.temperature);
	    HAL_UART_Transmit(&huart2, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);
    } else {
	     //throw error
	    HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET);
    }

    return sensorData;
}

DHT_Data temp_hum;


/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{

  /* USER CODE BEGIN 1 */

  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
  HAL_Init();

  /* USER CODE BEGIN Init */

  /* USER CODE END Init */

  /* Configure the system clock */
  SystemClock_Config();

  /* USER CODE BEGIN SysInit */

  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_DMA_Init();
  MX_USART2_UART_Init();
  MX_USART1_UART_Init();
  MX_TIM2_Init();
  MX_TIM5_Init();
  MX_USART3_UART_Init();
  MX_ADC1_Init();
  MX_I2C1_Init();
  MX_RTC_Init();
  MX_TIM3_Init();
  /* USER CODE BEGIN 2 */

  StartUartDmaReceive();
  Set_RTC_Alarm(rtc_mins);

//  get HAL_GetTick() returns a uint32


//  before any of this init code i need to start my micro second counter for the dht and read data from the sensor, this included the gps init as well
  HAL_TIM_Base_Start(&htim3);
  readAndTransmitDHT();
  uv_init();
  gps_init();

  char message[50];
  char NPKData[50];

//  this clear is so that the interrupt does not fire on start up
  __HAL_TIM_CLEAR_IT(&htim2, TIM_IT_UPDATE);
  __HAL_TIM_CLEAR_IT(&htim5, TIM_IT_UPDATE);
  HAL_TIM_Base_Start_IT(&htim2);
  HAL_TIM_Base_Start_IT(&htim5);

  HAL_ADCEx_Calibration_Start(&hadc1, ADC_SINGLE_ENDED);


  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */
  while (1)
  {
    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */

	  updateRollingBPS();

	  if(retry_publish != 0){
		  retry_publish_sensor_data(published_buffer);
		  continue;
	  }


	  if(new_data_flags ==  0b00000111){
		  temp_hum = readDHT();
		  temperature = temp_hum.temperature;
		  humidity = temp_hum.humidity;
		  create_dynamic_sensor_payload_case();
		  publish_sensor_data(MODULE_ID, sensor_data_case_1, sizeof(sensor_data_case_1));
	  }else if(new_data_flags == 0b01001111) {
		  temp_hum = readDHT();
		  temperature = temp_hum.temperature;
		  humidity = temp_hum.humidity;
		  NPK_ReadSensor_DMA();
		  HAL_Delay(63);

			sprintf(NPKData, "N: %d\r\n",
					nitrogen_value);
			HAL_UART_Transmit(&huart2, (uint8_t*)NPKData, strlen(NPKData), 1000);
		  create_dynamic_sensor_payload_case();
		  publish_sensor_data(MODULE_ID, sensor_data_case_2, sizeof(sensor_data_case_2));
	  }else if(new_data_flags == 0b01111111){
		  temp_hum = readDHT();
		  temperature = temp_hum.temperature;
		  humidity = temp_hum.humidity;
		  current_sensor = 0;
		  NPK_ReadSensor_DMA();
		  HAL_Delay(63);

		  current_sensor = 1;
		  Phosphorus_ReadSensor_DMA();
		  HAL_Delay(63);

		  current_sensor = 2;
		  Potassium_ReadSensor_DMA();
		  HAL_Delay(63);

			sprintf(NPKData, "N: %d, P: %d, K: %d\r\n",
					nitrogen_value,
					phosphorus_value,
					potassium_value);
			HAL_UART_Transmit(&huart2, (uint8_t*)NPKData, strlen(NPKData), 1000);

		  create_dynamic_sensor_payload_case();
		  publish_sensor_data(MODULE_ID, sensor_data_case_3, sizeof(sensor_data_case_3));

	  }else if(new_data_flags == 0b11111111){
		  temp_hum = readDHT();
		  temperature = temp_hum.temperature;
		  humidity = temp_hum.humidity;
		  current_sensor = 0;
		  NPK_ReadSensor_DMA();
		  HAL_Delay(63);

		  current_sensor = 1;
		  Phosphorus_ReadSensor_DMA();
		  HAL_Delay(63);

		  current_sensor = 2;
		  Potassium_ReadSensor_DMA();
		  HAL_Delay(63);

		  create_dynamic_sensor_payload_case();
		  publish_sensor_data(MODULE_ID, sensor_data_case_4, sizeof(sensor_data_case_4));


	  }else{
//		  Sleep logic if we still want to sleep the cpu while its not in a transmission case, not really an option if we always want the rolling bsp alg running
		  /*snprintf(message, sizeof(message), "CPU is going to sleep\r\n");
		  HAL_UART_Transmit(&huart2, (uint8_t*)message, strlen(message), HAL_MAX_DELAY);

		  HAL_SuspendTick();


		  HAL_PWR_EnterSLEEPMode(PWR_MAINREGULATOR_ON, PWR_SLEEPENTRY_WFI);

		  HAL_ResumeTick();*/

	  }
//	  this is only for testing rolling bps for now
	  HAL_Delay(200);

  }
  /* USER CODE END 3 */
}

/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

  /** Configure the main internal regulator output voltage
  */
  if (HAL_PWREx_ControlVoltageScaling(PWR_REGULATOR_VOLTAGE_SCALE1) != HAL_OK)
  {
    Error_Handler();
  }

  /** Configure LSE Drive Capability
  */
  HAL_PWR_EnableBkUpAccess();
  __HAL_RCC_LSEDRIVE_CONFIG(RCC_LSEDRIVE_LOW);

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI|RCC_OSCILLATORTYPE_LSE;
  RCC_OscInitStruct.LSEState = RCC_LSE_ON;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.HSICalibrationValue = RCC_HSICALIBRATION_DEFAULT;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSI;
  RCC_OscInitStruct.PLL.PLLM = 1;
  RCC_OscInitStruct.PLL.PLLN = 10;
  RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV7;
  RCC_OscInitStruct.PLL.PLLQ = RCC_PLLQ_DIV2;
  RCC_OscInitStruct.PLL.PLLR = RCC_PLLR_DIV2;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV1;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_4) != HAL_OK)
  {
    Error_Handler();
  }
}

/**
  * @brief ADC1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_ADC1_Init(void)
{

  /* USER CODE BEGIN ADC1_Init 0 */

  /* USER CODE END ADC1_Init 0 */

  ADC_MultiModeTypeDef multimode = {0};
  ADC_ChannelConfTypeDef sConfig = {0};

  /* USER CODE BEGIN ADC1_Init 1 */

  /* USER CODE END ADC1_Init 1 */

  /** Common config
  */
  hadc1.Instance = ADC1;
  hadc1.Init.ClockPrescaler = ADC_CLOCK_ASYNC_DIV1;
  hadc1.Init.Resolution = ADC_RESOLUTION_12B;
  hadc1.Init.DataAlign = ADC_DATAALIGN_RIGHT;
  hadc1.Init.ScanConvMode = ADC_SCAN_DISABLE;
  hadc1.Init.EOCSelection = ADC_EOC_SINGLE_CONV;
  hadc1.Init.LowPowerAutoWait = DISABLE;
  hadc1.Init.ContinuousConvMode = DISABLE;
  hadc1.Init.NbrOfConversion = 1;
  hadc1.Init.DiscontinuousConvMode = DISABLE;
  hadc1.Init.ExternalTrigConv = ADC_SOFTWARE_START;
  hadc1.Init.ExternalTrigConvEdge = ADC_EXTERNALTRIGCONVEDGE_NONE;
  hadc1.Init.DMAContinuousRequests = DISABLE;
  hadc1.Init.Overrun = ADC_OVR_DATA_PRESERVED;
  hadc1.Init.OversamplingMode = DISABLE;
  if (HAL_ADC_Init(&hadc1) != HAL_OK)
  {
    Error_Handler();
  }

  /** Configure the ADC multi-mode
  */
  multimode.Mode = ADC_MODE_INDEPENDENT;
  if (HAL_ADCEx_MultiModeConfigChannel(&hadc1, &multimode) != HAL_OK)
  {
    Error_Handler();
  }

  /** Configure Regular Channel
  */
  sConfig.Channel = ADC_CHANNEL_5;
  sConfig.Rank = ADC_REGULAR_RANK_1;
  sConfig.SamplingTime = ADC_SAMPLETIME_2CYCLES_5;
  sConfig.SingleDiff = ADC_SINGLE_ENDED;
  sConfig.OffsetNumber = ADC_OFFSET_NONE;
  sConfig.Offset = 0;
  if (HAL_ADC_ConfigChannel(&hadc1, &sConfig) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN ADC1_Init 2 */

  /* USER CODE END ADC1_Init 2 */

}

/**
  * @brief I2C1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_I2C1_Init(void)
{

  /* USER CODE BEGIN I2C1_Init 0 */

  /* USER CODE END I2C1_Init 0 */

  /* USER CODE BEGIN I2C1_Init 1 */

  /* USER CODE END I2C1_Init 1 */
  hi2c1.Instance = I2C1;
  hi2c1.Init.Timing = 0x10D19CE4;
  hi2c1.Init.OwnAddress1 = 0;
  hi2c1.Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;
  hi2c1.Init.DualAddressMode = I2C_DUALADDRESS_DISABLE;
  hi2c1.Init.OwnAddress2 = 0;
  hi2c1.Init.OwnAddress2Masks = I2C_OA2_NOMASK;
  hi2c1.Init.GeneralCallMode = I2C_GENERALCALL_DISABLE;
  hi2c1.Init.NoStretchMode = I2C_NOSTRETCH_DISABLE;
  if (HAL_I2C_Init(&hi2c1) != HAL_OK)
  {
    Error_Handler();
  }

  /** Configure Analogue filter
  */
  if (HAL_I2CEx_ConfigAnalogFilter(&hi2c1, I2C_ANALOGFILTER_ENABLE) != HAL_OK)
  {
    Error_Handler();
  }

  /** Configure Digital filter
  */
  if (HAL_I2CEx_ConfigDigitalFilter(&hi2c1, 0) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN I2C1_Init 2 */

  /* USER CODE END I2C1_Init 2 */

}

/**
  * @brief RTC Initialization Function
  * @param None
  * @retval None
  */
static void MX_RTC_Init(void)
{

  /* USER CODE BEGIN RTC_Init 0 */

  /* USER CODE END RTC_Init 0 */

  RTC_TimeTypeDef sTime = {0};
  RTC_DateTypeDef sDate = {0};
  RTC_AlarmTypeDef sAlarm = {0};

  /* USER CODE BEGIN RTC_Init 1 */

  /* USER CODE END RTC_Init 1 */

  /** Initialize RTC Only
  */
  hrtc.Instance = RTC;
  hrtc.Init.HourFormat = RTC_HOURFORMAT_24;
  hrtc.Init.AsynchPrediv = 127;
  hrtc.Init.SynchPrediv = 255;
  hrtc.Init.OutPut = RTC_OUTPUT_DISABLE;
  hrtc.Init.OutPutRemap = RTC_OUTPUT_REMAP_NONE;
  hrtc.Init.OutPutPolarity = RTC_OUTPUT_POLARITY_HIGH;
  hrtc.Init.OutPutType = RTC_OUTPUT_TYPE_OPENDRAIN;
  if (HAL_RTC_Init(&hrtc) != HAL_OK)
  {
    Error_Handler();
  }

  /* USER CODE BEGIN Check_RTC_BKUP */

  /* USER CODE END Check_RTC_BKUP */

  /** Initialize RTC and set the Time and Date
  */
  sTime.Hours = 0x0;
  sTime.Minutes = 0x0;
  sTime.Seconds = 0x0;
  sTime.DayLightSaving = RTC_DAYLIGHTSAVING_NONE;
  sTime.StoreOperation = RTC_STOREOPERATION_RESET;
  if (HAL_RTC_SetTime(&hrtc, &sTime, RTC_FORMAT_BCD) != HAL_OK)
  {
    Error_Handler();
  }
  sDate.WeekDay = RTC_WEEKDAY_MONDAY;
  sDate.Month = RTC_MONTH_JANUARY;
  sDate.Date = 0x1;
  sDate.Year = 0x0;

  if (HAL_RTC_SetDate(&hrtc, &sDate, RTC_FORMAT_BCD) != HAL_OK)
  {
    Error_Handler();
  }

  /** Enable the Alarm A
  */
  sAlarm.AlarmTime.Hours = 0x0;
  sAlarm.AlarmTime.Minutes = 0x0;
  sAlarm.AlarmTime.Seconds = 0x0;
  sAlarm.AlarmTime.SubSeconds = 0x0;
  sAlarm.AlarmTime.DayLightSaving = RTC_DAYLIGHTSAVING_NONE;
  sAlarm.AlarmTime.StoreOperation = RTC_STOREOPERATION_RESET;
  sAlarm.AlarmMask = RTC_ALARMMASK_NONE;
  sAlarm.AlarmSubSecondMask = RTC_ALARMSUBSECONDMASK_ALL;
  sAlarm.AlarmDateWeekDaySel = RTC_ALARMDATEWEEKDAYSEL_DATE;
  sAlarm.AlarmDateWeekDay = 0x1;
  sAlarm.Alarm = RTC_ALARM_A;
  if (HAL_RTC_SetAlarm_IT(&hrtc, &sAlarm, RTC_FORMAT_BCD) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN RTC_Init 2 */

  /* USER CODE END RTC_Init 2 */

}

/**
  * @brief TIM2 Initialization Function
  * @param None
  * @retval None
  */
static void MX_TIM2_Init(void)
{

  /* USER CODE BEGIN TIM2_Init 0 */

  /* USER CODE END TIM2_Init 0 */

  TIM_ClockConfigTypeDef sClockSourceConfig = {0};
  TIM_MasterConfigTypeDef sMasterConfig = {0};

  /* USER CODE BEGIN TIM2_Init 1 */

  /* USER CODE END TIM2_Init 1 */
  htim2.Instance = TIM2;
  htim2.Init.Prescaler = 7999;
  htim2.Init.CounterMode = TIM_COUNTERMODE_UP;
  htim2.Init.Period = 149999;
  htim2.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
  htim2.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_DISABLE;
  if (HAL_TIM_Base_Init(&htim2) != HAL_OK)
  {
    Error_Handler();
  }
  sClockSourceConfig.ClockSource = TIM_CLOCKSOURCE_INTERNAL;
  if (HAL_TIM_ConfigClockSource(&htim2, &sClockSourceConfig) != HAL_OK)
  {
    Error_Handler();
  }
  sMasterConfig.MasterOutputTrigger = TIM_TRGO_RESET;
  sMasterConfig.MasterSlaveMode = TIM_MASTERSLAVEMODE_DISABLE;
  if (HAL_TIMEx_MasterConfigSynchronization(&htim2, &sMasterConfig) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN TIM2_Init 2 */

  /* USER CODE END TIM2_Init 2 */

}

/**
  * @brief TIM3 Initialization Function
  * @param None
  * @retval None
  */
static void MX_TIM3_Init(void)
{

  /* USER CODE BEGIN TIM3_Init 0 */

  /* USER CODE END TIM3_Init 0 */

  TIM_ClockConfigTypeDef sClockSourceConfig = {0};
  TIM_MasterConfigTypeDef sMasterConfig = {0};

  /* USER CODE BEGIN TIM3_Init 1 */

  /* USER CODE END TIM3_Init 1 */
  htim3.Instance = TIM3;
  htim3.Init.Prescaler = 79;
  htim3.Init.CounterMode = TIM_COUNTERMODE_UP;
  htim3.Init.Period = 65535;
  htim3.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
  htim3.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_DISABLE;
  if (HAL_TIM_Base_Init(&htim3) != HAL_OK)
  {
    Error_Handler();
  }
  sClockSourceConfig.ClockSource = TIM_CLOCKSOURCE_INTERNAL;
  if (HAL_TIM_ConfigClockSource(&htim3, &sClockSourceConfig) != HAL_OK)
  {
    Error_Handler();
  }
  sMasterConfig.MasterOutputTrigger = TIM_TRGO_RESET;
  sMasterConfig.MasterSlaveMode = TIM_MASTERSLAVEMODE_DISABLE;
  if (HAL_TIMEx_MasterConfigSynchronization(&htim3, &sMasterConfig) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN TIM3_Init 2 */

  /* USER CODE END TIM3_Init 2 */

}

/**
  * @brief TIM5 Initialization Function
  * @param None
  * @retval None
  */
static void MX_TIM5_Init(void)
{

  /* USER CODE BEGIN TIM5_Init 0 */

  /* USER CODE END TIM5_Init 0 */

  TIM_ClockConfigTypeDef sClockSourceConfig = {0};
  TIM_MasterConfigTypeDef sMasterConfig = {0};

  /* USER CODE BEGIN TIM5_Init 1 */

  /* USER CODE END TIM5_Init 1 */
  htim5.Instance = TIM5;
  htim5.Init.Prescaler = 7999;
  htim5.Init.CounterMode = TIM_COUNTERMODE_UP;
  htim5.Init.Period = 599999;
  htim5.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
  htim5.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_DISABLE;
  if (HAL_TIM_Base_Init(&htim5) != HAL_OK)
  {
    Error_Handler();
  }
  sClockSourceConfig.ClockSource = TIM_CLOCKSOURCE_INTERNAL;
  if (HAL_TIM_ConfigClockSource(&htim5, &sClockSourceConfig) != HAL_OK)
  {
    Error_Handler();
  }
  sMasterConfig.MasterOutputTrigger = TIM_TRGO_RESET;
  sMasterConfig.MasterSlaveMode = TIM_MASTERSLAVEMODE_DISABLE;
  if (HAL_TIMEx_MasterConfigSynchronization(&htim5, &sMasterConfig) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN TIM5_Init 2 */

  /* USER CODE END TIM5_Init 2 */

}

/**
  * @brief USART1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_USART1_UART_Init(void)
{

  /* USER CODE BEGIN USART1_Init 0 */

  /* USER CODE END USART1_Init 0 */

  /* USER CODE BEGIN USART1_Init 1 */

  /* USER CODE END USART1_Init 1 */
  huart1.Instance = USART1;
  huart1.Init.BaudRate = 9600;
  huart1.Init.WordLength = UART_WORDLENGTH_8B;
  huart1.Init.StopBits = UART_STOPBITS_1;
  huart1.Init.Parity = UART_PARITY_NONE;
  huart1.Init.Mode = UART_MODE_TX_RX;
  huart1.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart1.Init.OverSampling = UART_OVERSAMPLING_16;
  huart1.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
  huart1.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart1) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN USART1_Init 2 */

  /* USER CODE END USART1_Init 2 */

}

/**
  * @brief USART2 Initialization Function
  * @param None
  * @retval None
  */
static void MX_USART2_UART_Init(void)
{

  /* USER CODE BEGIN USART2_Init 0 */

  /* USER CODE END USART2_Init 0 */

  /* USER CODE BEGIN USART2_Init 1 */

  /* USER CODE END USART2_Init 1 */
  huart2.Instance = USART2;
  huart2.Init.BaudRate = 115200;
  huart2.Init.WordLength = UART_WORDLENGTH_8B;
  huart2.Init.StopBits = UART_STOPBITS_1;
  huart2.Init.Parity = UART_PARITY_NONE;
  huart2.Init.Mode = UART_MODE_TX_RX;
  huart2.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart2.Init.OverSampling = UART_OVERSAMPLING_16;
  huart2.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
  huart2.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart2) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN USART2_Init 2 */

  /* USER CODE END USART2_Init 2 */

}

/**
  * @brief USART3 Initialization Function
  * @param None
  * @retval None
  */
static void MX_USART3_UART_Init(void)
{

  /* USER CODE BEGIN USART3_Init 0 */

  /* USER CODE END USART3_Init 0 */

  /* USER CODE BEGIN USART3_Init 1 */

  /* USER CODE END USART3_Init 1 */
  huart3.Instance = USART3;
  huart3.Init.BaudRate = 9600;
  huart3.Init.WordLength = UART_WORDLENGTH_8B;
  huart3.Init.StopBits = UART_STOPBITS_1;
  huart3.Init.Parity = UART_PARITY_NONE;
  huart3.Init.Mode = UART_MODE_TX_RX;
  huart3.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart3.Init.OverSampling = UART_OVERSAMPLING_16;
  huart3.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
  huart3.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart3) != HAL_OK)
  {
    Error_Handler();
  }
  /* USER CODE BEGIN USART3_Init 2 */

  /* USER CODE END USART3_Init 2 */

}

/**
  * Enable DMA controller clock
  */
static void MX_DMA_Init(void)
{

  /* DMA controller clock enable */
  __HAL_RCC_DMA1_CLK_ENABLE();

  /* DMA interrupt init */
  /* DMA1_Channel2_IRQn interrupt configuration */
  HAL_NVIC_SetPriority(DMA1_Channel2_IRQn, 0, 0);
  HAL_NVIC_EnableIRQ(DMA1_Channel2_IRQn);
  /* DMA1_Channel3_IRQn interrupt configuration */
  HAL_NVIC_SetPriority(DMA1_Channel3_IRQn, 0, 0);
  HAL_NVIC_EnableIRQ(DMA1_Channel3_IRQn);
  /* DMA1_Channel4_IRQn interrupt configuration */
  HAL_NVIC_SetPriority(DMA1_Channel4_IRQn, 0, 0);
  HAL_NVIC_EnableIRQ(DMA1_Channel4_IRQn);
  /* DMA1_Channel5_IRQn interrupt configuration */
  HAL_NVIC_SetPriority(DMA1_Channel5_IRQn, 0, 0);
  HAL_NVIC_EnableIRQ(DMA1_Channel5_IRQn);

}

/**
  * @brief GPIO Initialization Function
  * @param None
  * @retval None
  */
static void MX_GPIO_Init(void)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};
/* USER CODE BEGIN MX_GPIO_Init_1 */
/* USER CODE END MX_GPIO_Init_1 */

  /* GPIO Ports Clock Enable */
  __HAL_RCC_GPIOC_CLK_ENABLE();
  __HAL_RCC_GPIOH_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();
  __HAL_RCC_GPIOB_CLK_ENABLE();

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(GPIOA, LD2_Pin|GPIO_PIN_8, GPIO_PIN_RESET);

  /*Configure GPIO pin Output Level */
  HAL_GPIO_WritePin(GPIOC, GPIO_PIN_7|GPIO_PIN_8, GPIO_PIN_RESET);

  /*Configure GPIO pin : B1_Pin */
  GPIO_InitStruct.Pin = B1_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_IT_FALLING;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(B1_GPIO_Port, &GPIO_InitStruct);

  /*Configure GPIO pins : LD2_Pin PA8 */
  GPIO_InitStruct.Pin = LD2_Pin|GPIO_PIN_8;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

  /*Configure GPIO pin : PC6 */
  GPIO_InitStruct.Pin = GPIO_PIN_6;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);

  /*Configure GPIO pins : PC7 PC8 */
  GPIO_InitStruct.Pin = GPIO_PIN_7|GPIO_PIN_8;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);

/* USER CODE BEGIN MX_GPIO_Init_2 */
/* USER CODE END MX_GPIO_Init_2 */
}

/* USER CODE BEGIN 4 */

/* USER CODE END 4 */

/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  /* USER CODE BEGIN Error_Handler_Debug */
  /* User can add his own implementation to report the HAL error return state */
  __disable_irq();
  while (1)
  {
  }
  /* USER CODE END Error_Handler_Debug */
}

#ifdef  USE_FULL_ASSERT
/**
  * @brief  Reports the name of the source file and the source line number
  *         where the assert_param error has occurred.
  * @param  file: pointer to the source file name
  * @param  line: assert_param error line source number
  * @retval None
  */
void assert_failed(uint8_t *file, uint32_t line)
{
  /* USER CODE BEGIN 6 */
  /* User can add his own implementation to report the file name and line number,
     ex: printf("Wrong parameters value: file %s on line %d\r\n", file, line) */
  /* USER CODE END 6 */
}
#endif /* USE_FULL_ASSERT */
