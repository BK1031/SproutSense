#include "TSL2591.h"

#include "stm32l4xx_hal.h"  // Use the correct HAL header for STM32L4

// Implementation of TSL2591 functions remains unchanged

// Define registers and constants
#define TSL2591_ADDR                (0x29 << 1)
#define TSL2591_COMMAND_BIT         0xA0
#define TSL2591_REGISTER_ENABLE     0x00
#define TSL2591_REGISTER_CONTROL    0x01
#define TSL2591_REGISTER_DEVICE_ID  0x12
#define TSL2591_REGISTER_CHAN0_LOW  0x14
#define TSL2591_REGISTER_CHAN1_LOW  0x16
#define TSL2591_ENABLE_POWERON      0x01
#define TSL2591_ENABLE_AEN          0x02
#define TSL2591_ENABLE_POWEROFF     0x00
#define TSL2591_GAIN_MED            0x10
#define TSL2591_INTEGRATIONTIME_100MS  0x01



// Function prototypes
HAL_StatusTypeDef TSL2591_Init(TSL2591* sensor, I2C_HandleTypeDef* hi2c);
HAL_StatusTypeDef TSL2591_Enable(TSL2591* sensor);
HAL_StatusTypeDef TSL2591_Disable(TSL2591* sensor);
HAL_StatusTypeDef TSL2591_SetIntegrationGain(TSL2591* sensor, uint8_t integration, uint8_t gain);
HAL_StatusTypeDef TSL2591_ReadRawData(TSL2591* sensor, uint16_t* ch0, uint16_t* ch1);
float TSL2591_CalculateLux(uint16_t ch0, uint16_t ch1, uint8_t integrationTime, uint8_t gain);
HAL_StatusTypeDef TSL2591_ReadByte(TSL2591* sensor, uint8_t reg, uint8_t* value);
HAL_StatusTypeDef TSL2591_WriteByte(TSL2591* sensor, uint8_t reg, uint8_t value);

// Function definitions
HAL_StatusTypeDef TSL2591_Init(TSL2591* sensor, I2C_HandleTypeDef* hi2c) {
    sensor->i2cHandle = hi2c;
    sensor->address = TSL2591_ADDR;
    sensor->integrationTime = TSL2591_INTEGRATIONTIME_100MS;
    sensor->gain = TSL2591_GAIN_MED;

    // Check device ID
    uint8_t deviceID;
    if (TSL2591_ReadByte(sensor, TSL2591_REGISTER_DEVICE_ID, &deviceID) != HAL_OK || deviceID != 0x50) {
        return HAL_ERROR;
    }

    // Enable the sensor
    return TSL2591_Enable(sensor);
}

HAL_StatusTypeDef TSL2591_Enable(TSL2591* sensor) {
    uint8_t enableValue = TSL2591_ENABLE_POWERON | TSL2591_ENABLE_AEN;
    return TSL2591_WriteByte(sensor, TSL2591_REGISTER_ENABLE, enableValue);
}

HAL_StatusTypeDef TSL2591_Disable(TSL2591* sensor) {
    return TSL2591_WriteByte(sensor, TSL2591_REGISTER_ENABLE, TSL2591_ENABLE_POWEROFF);
}

HAL_StatusTypeDef TSL2591_SetIntegrationGain(TSL2591* sensor, uint8_t integration, uint8_t gain) {
    sensor->integrationTime = integration;
    sensor->gain = gain;
    uint8_t controlValue = integration | gain;
    return TSL2591_WriteByte(sensor, TSL2591_REGISTER_CONTROL, controlValue);
}

HAL_StatusTypeDef TSL2591_ReadRawData(TSL2591* sensor, uint16_t* ch0, uint16_t* ch1) {
    uint8_t data[4];
    HAL_StatusTypeDef status = HAL_I2C_Mem_Read(sensor->i2cHandle, sensor->address,
                                                TSL2591_REGISTER_CHAN0_LOW, I2C_MEMADD_SIZE_8BIT,
                                                data, 4, HAL_MAX_DELAY);
    if (status != HAL_OK) {
        printf("I2C Read Error: %d\r\n", status);
        return HAL_ERROR;
    }

    // Combine bytes into 16-bit values
    *ch0 = (data[1] << 8) | data[0];
    *ch1 = (data[3] << 8) | data[2];

    printf("Raw Data - CH0: %u, CH1: %u\r\n", *ch0, *ch1); // Debug print
    return HAL_OK;
}

float TSL2591_CalculateLux(uint16_t ch0, uint16_t ch1, uint8_t integrationTime, uint8_t gain) {
    float atime = (integrationTime + 1) * 100.0f;  // Convert integration setting to ms
    float again = (gain == TSL2591_GAIN_MED) ? 25.0f : 1.0f;  // Example for medium gain

    float cpl = (atime * again) / 408.0f;
    float lux = ((float)ch0 - (float)ch1) * (1.0f - ((float)ch1 / (float)ch0)) / cpl;
    return lux > 0 ? lux : 0;
}

HAL_StatusTypeDef TSL2591_ReadByte(TSL2591* sensor, uint8_t reg, uint8_t* value) {
    return HAL_I2C_Mem_Read(sensor->i2cHandle, sensor->address, reg | TSL2591_COMMAND_BIT, I2C_MEMADD_SIZE_8BIT, value, 1, HAL_MAX_DELAY);
}

HAL_StatusTypeDef TSL2591_WriteByte(TSL2591* sensor, uint8_t reg, uint8_t value) {
    return HAL_I2C_Mem_Write(sensor->i2cHandle, sensor->address, reg | TSL2591_COMMAND_BIT, I2C_MEMADD_SIZE_8BIT, &value, 1, HAL_MAX_DELAY);
}
