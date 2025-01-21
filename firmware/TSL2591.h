#ifndef TSL2591_H
#define TSL2591_H

#include "stm32l4xx_hal.h"
#include <stdint.h>

/** TSL2591 Constants */
#define TSL2591_VISIBLE            2 ///< Visible light channel
#define TSL2591_INFRARED           1 ///< Infrared light channel
#define TSL2591_FULLSPECTRUM       0 ///< Full-spectrum light channel

#define TSL2591_ADDR               (0x29 << 1) ///< Default I2C address
#define TSL2591_COMMAND_BIT        0xA0 ///< Command bit for register access

/** Special Function Commands */
#define TSL2591_CLEAR_INT          0xE7 ///< Clear ALS and no persist ALS interrupt
#define TSL2591_TEST_INT           0xE4 ///< Interrupt set - forces an interrupt

/** Enable Register Flags */
#define TSL2591_ENABLE_POWEROFF    0x00 ///< Disable power
#define TSL2591_ENABLE_POWERON     0x01 ///< Enable power
#define TSL2591_ENABLE_AEN         0x02 ///< ALS enable
#define TSL2591_ENABLE_AIEN        0x10 ///< ALS interrupt enable
#define TSL2591_ENABLE_NPIEN       0x80 ///< No persist interrupt enable

/** Lux Calculation Coefficients */
#define TSL2591_LUX_DF             408.0f ///< Lux coefficient
#define TSL2591_LUX_COEFB          1.64f ///< CH0 coefficient
#define TSL2591_LUX_COEFC          0.59f ///< CH1 coefficient A
#define TSL2591_LUX_COEFD          0.86f ///< CH2 coefficient B

/** TSL2591 Register Map */
#define TSL2591_REGISTER_ENABLE            0x00 ///< Enable register
#define TSL2591_REGISTER_CONTROL           0x01 ///< Control register
#define TSL2591_REGISTER_DEVICE_ID         0x12 ///< Device ID register
#define TSL2591_REGISTER_CHAN0_LOW         0x14 ///< Channel 0 low byte
#define TSL2591_REGISTERd_CHAN0_HIGH        0x15 ///< Channel 0 high byte
#define TSL2591_REGISTER_CHAN1_LOW         0x16 ///< Channel 1 low byte
#define TSL2591_REGISTER_CHAN1_HIGH        0x17 ///< Channel 1 high byte

/** Integration Time Enum */
typedef enum {
    TSL2591_INTEGRATIONTIME_100MS = 0x00, ///< 100 ms integration time
    TSL2591_INTEGRATIONTIME_200MS = 0x01, ///< 200 ms integration time
    TSL2591_INTEGRATIONTIME_300MS = 0x02, ///< 300 ms integration time
    TSL2591_INTEGRATIONTIME_400MS = 0x03, ///< 400 ms integration time
    TSL2591_INTEGRATIONTIME_500MS = 0x04, ///< 500 ms integration time
    TSL2591_INTEGRATIONTIME_600MS = 0x05  ///< 600 ms integration time
} TSL2591_IntegrationTime;

/** Gain Enum */
typedef enum {
    TSL2591_GAIN_LOW  = 0x00, ///< Low gain (1x)
    TSL2591_GAIN_MED  = 0x10, ///< Medium gain (25x)
    TSL2591_GAIN_HIGH = 0x20, ///< High gain (428x)
    TSL2591_GAIN_MAX  = 0x30  ///< Maximum gain (9876x)
} TSL2591_Gain;

/** TSL2591 Sensor Struct */
typedef struct {
    I2C_HandleTypeDef* i2cHandle; ///< I2C handle
    uint8_t address;             ///< I2C address of the sensor
    TSL2591_IntegrationTime integrationTime; ///< Integration time setting
    TSL2591_Gain gain; ///< Gain setting
} TSL2591;

/** Function Prototypes */
HAL_StatusTypeDef TSL2591_Init(TSL2591* sensor, I2C_HandleTypeDef* hi2c);
HAL_StatusTypeDef TSL2591_Enable(TSL2591* sensor);
HAL_StatusTypeDef TSL2591_Disable(TSL2591* sensor);
HAL_StatusTypeDef TSL2591_SetIntegrationGain(TSL2591* sensor, TSL2591_IntegrationTime integration, TSL2591_Gain gain);
HAL_StatusTypeDef TSL2591_ReadRawData(TSL2591* sensor, uint16_t* ch0, uint16_t* ch1);
float TSL2591_CalculateLux(uint16_t ch0, uint16_t ch1, TSL2591_IntegrationTime integration, TSL2591_Gain gain);
HAL_StatusTypeDef TSL2591_ReadByte(TSL2591* sensor, uint8_t reg, uint8_t* value);
HAL_StatusTypeDef TSL2591_WriteByte(TSL2591* sensor, uint8_t reg, uint8_t value);

#endif /* _TSL2591_H_ */
