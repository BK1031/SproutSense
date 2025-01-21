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

#include "main.h"
#include <stdio.h>
#include <math.h>

#include "TSL2591.h"
/* Private variables ---------------------------------------------------------*/
I2C_HandleTypeDef hi2c1;
UART_HandleTypeDef huart2;
UART_HandleTypeDef huart1;

/* TSL2591 Constants */
#define TSL2591_ADDR             (0x29 << 1) // 7-bit address shifted for 8-bit I2C format
#define TSL2591_REG_ENABLE       0x00
#define TSL2591_REG_CONTROL      0x01
#define TSL2591_REG_C0DATAL      0x14
#define TSL2591_ENABLE_POWER_ON  0x01  // Power ON bit
#define TSL2591_ENABLE_ALS       0x02  // ALS Enable bit
#define TSL2591_CONTROL_GAIN_MED 0x10  // Medium gain
#define TSL2591_CONTROL_IT_300MS 0x02  // 300ms integration time

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_USART2_UART_Init(void);
static void MX_I2C1_Init(void);
int __io_putchar(int ch);
void configureSensor(void);
void testRegisterWriteRead(void);
void readSensorData(void);
float calculateLux(uint16_t channel0, uint16_t channel1);
TSL2591 tsl2591;
#define TSL2591_I2C_ADDRESS  0x29 << 1  // Replace 0x29 with your sensor's I2C address
#define TSL2591_COMMAND_BIT 0xA0       // Command byte prefix

/* USER CODE BEGIN 0 */
int __io_putchar(int ch) {
    HAL_UART_Transmit(&huart2, (uint8_t *)&ch, 1, HAL_MAX_DELAY);
    return ch;
}

void configureSensor(void) {
    HAL_StatusTypeDef status;
    uint8_t enableValue;

    // Power ON
    enableValue = TSL2591_ENABLE_POWER_ON;
    status = HAL_I2C_Mem_Write(&hi2c1, TSL2591_ADDR, TSL2591_REG_ENABLE, 1, &enableValue, 1, HAL_MAX_DELAY);
    HAL_Delay(100);
    printf("Power ON write %s\r\n", (status == HAL_OK) ? "successful" : "failed");

    // Enable ALS
    enableValue = TSL2591_ENABLE_POWER_ON | TSL2591_ENABLE_ALS;
    status = HAL_I2C_Mem_Write(&hi2c1, TSL2591_ADDR, TSL2591_REG_ENABLE, 1, &enableValue, 1, HAL_MAX_DELAY);
    HAL_Delay(100);
    printf("ALS enable write %s\r\n", (status == HAL_OK) ? "successful" : "failed");

    // Configure CONTROL register
    uint8_t controlValue = TSL2591_CONTROL_GAIN_MED | TSL2591_CONTROL_IT_300MS;
    status = HAL_I2C_Mem_Write(&hi2c1, TSL2591_ADDR, TSL2591_REG_CONTROL, 1, &controlValue, 1, HAL_MAX_DELAY);
    HAL_Delay(100);
    printf("Control register write %s\r\n", (status == HAL_OK) ? "successful" : "failed");
}

void testRegisterWriteRead(void) {
    uint8_t readBack;

    // Verify ENABLE register
    HAL_I2C_Mem_Read(&hi2c1, TSL2591_ADDR, TSL2591_REG_ENABLE, 1, &readBack, 1, HAL_MAX_DELAY);
    printf("Enable Register Read Back: 0x%02X\r\n", readBack);

    // Verify CONTROL register
    HAL_I2C_Mem_Read(&hi2c1, TSL2591_ADDR, TSL2591_REG_CONTROL, 1, &readBack, 1, HAL_MAX_DELAY);
    printf("Control Register Read Back: 0x%02X\r\n", readBack);
}

void readSensorData(void) {
    uint8_t data[4];
    uint16_t channel0, channel1;

    if (HAL_I2C_Mem_Read(&hi2c1, TSL2591_ADDR, TSL2591_REG_C0DATAL, 1, data, 4, HAL_MAX_DELAY) == HAL_OK) {
        channel0 = (data[1] << 8) | data[0];
        channel1 = (data[3] << 8) | data[2];

       // printf("Channel 0: %u, Channel 1: %u\r\n", channel0, channel1);
        float lux = calculateLux(channel0, channel1);
       // printf("Calculated Lux: %.2f\r\n", lux);
    } else {
        printf("Failed to read channel data\r\n");
    }
}

float calculateLux(uint16_t channel0, uint16_t channel1) {
    if (channel0 == 0) return 0.0f;

    float ratio = (float)channel1 / (float)channel0;
    if (ratio <= 0.5) {
        return (0.0304 * channel0) - (0.062 * channel0 * pow(ratio, 1.4));
    } else if (ratio <= 0.61) {
        return (0.0224 * channel0) - (0.031 * channel1);
    } else if (ratio <= 0.80) {
        return (0.0128 * channel0) - (0.0153 * channel1);
    } else if (ratio <= 1.30) {
        return (0.00146 * channel0) - (0.00112 * channel1);
    } else {
        return 0.0f;
    }
}
/* USER CODE END 0 */


void PrintSensorInfo(void) {
    uint8_t enableRegister, controlRegister, data[4];
    uint16_t channel0, channel1;

    // Read and print the ENABLE register
    if (HAL_I2C_Mem_Read(&hi2c1, TSL2591_ADDR, TSL2591_REG_ENABLE, 1, &enableRegister, 1, HAL_MAX_DELAY) == HAL_OK) {
        printf("Enable Register: 0x%02X\r\n", enableRegister);
    } else {
        printf("Failed to read Enable Register\r\n");
    }

    // Read and print the CONTROL register
    if (HAL_I2C_Mem_Read(&hi2c1, TSL2591_ADDR, TSL2591_REG_CONTROL, 1, &controlRegister, 1, HAL_MAX_DELAY) == HAL_OK) {
        printf("Control Register: 0x%02X\r\n", controlRegister);
    } else {
        printf("Failed to read Control Register\r\n");
    }

    // Read channel data
    if (HAL_I2C_Mem_Read(&hi2c1, TSL2591_ADDR, TSL2591_REG_C0DATAL, 1, data, 4, HAL_MAX_DELAY) == HAL_OK) {
        channel0 = (data[1] << 8) | data[0]; // Combine low and high bytes for channel 0
        channel1 = (data[3] << 8) | data[2]; // Combine low and high bytes for channel 1

        // Print channel data
        printf("Channel 0 (Full Spectrum): %u\r\n", channel0);
        printf("Channel 1 (Infrared): %u\r\n", channel1);

        // Calculate visible light
        uint16_t visible = (channel0 > channel1) ? (channel0 - channel1) : 0;
        printf("Visible Light: %u\r\n", visible);

        // Calculate lux
        float atime = 300.0;  // Integration time in ms
        float again = 25.0;   // Gain multiplier
        float cpl = (atime * again) / 408.0; // Scaling factor
        float lux = ((float)channel0 - (float)channel1) / cpl;
        if (lux < 0) lux = 0;

        // Print lux value
        int lux_int = (int)(lux * 100); // Scale to integer for better formatting
        printf("Calculated Lux: %d.%02d\r\n", lux_int / 100, lux_int % 100);
    } else {
        printf("Failed to read channel data\r\n");
    }
}




HAL_StatusTypeDef TSL2591_ReadChannels(I2C_HandleTypeDef *hi2c, uint16_t *channel0, uint16_t *channel1) {
    uint8_t data[4];

    // Read 4 bytes starting from C0DATAL register
    HAL_StatusTypeDef status = HAL_I2C_Mem_Read(hi2c, TSL2591_ADDR, TSL2591_REG_C0DATAL, 1, data, 4, HAL_MAX_DELAY);
    if (status == HAL_OK) {
        // Combine low and high bytes for each channel
        *channel0 = (data[1] << 8) | data[0]; // Channel 0 (C0DATA)
        *channel1 = (data[3] << 8) | data[2]; // Channel 1 (C1DATA)
    } else {
        printf("I2C Read Failed: %d\r\n", status);
    }

    return status;
}


void I2C_Scan(I2C_HandleTypeDef* hi2c) {
    printf("Scanning I2C bus...\r\n");
    for (uint16_t i = 0; i < 128; i++) {
        if (HAL_I2C_IsDeviceReady(hi2c, (i << 1), 1, HAL_MAX_DELAY) == HAL_OK) {
            printf("Device found at address: 0x%02X\r\n", i);
        }
    }
    printf("I2C scan complete.\r\n");
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

void read_tsl2591_channels(I2C_HandleTypeDef *hi2c, uint16_t *ch0, uint16_t *ch1) {
    *ch0 = read_tsl2591_data(hi2c, 0x14, 0x15);
    *ch1 = read_tsl2591_data(hi2c, 0x16, 0x17);
}
int main(void) {
    HAL_Init();
    SystemClock_Config();
    MX_GPIO_Init();
    MX_I2C1_Init();
    MX_USART2_UART_Init();

    TSL2591 tslSensor;
    uint16_t channel0 = 0, channel1 = 0;
    float lux;



    printf("Initializing TSL2591 Sensor...\r\n");
    if (TSL2591_Init(&tslSensor, &hi2c1) == HAL_OK) {
        printf("TSL2591 sensor initialized successfully.\r\n");

        // Enable and verify
        if (TSL2591_Enable(&tslSensor) != HAL_OK) {
            printf("Failed to enable the sensor.\r\n");
            Error_Handler();
        }

        uint8_t enableValue = 0;

        // Set integration time and gain
        if (TSL2591_SetIntegrationGain(&tslSensor, TSL2591_INTEGRATIONTIME_600MS, TSL2591_GAIN_MED) == HAL_OK) {
            printf("Integration time and gain set to 600ms and medium gain.\r\n");
            HAL_Delay(600); // Wait for integration time
        } else {
            printf("Failed to set integration time and gain.\r\n");
        }
    } else {
        printf("Failed to initialize TSL2591 sensor. Check wiring and power.\r\n");
        Error_Handler();
    }

    uint8_t ch0_low, ch0_high, ch1_low, ch1_high; // Variables for register values
    uint16_t ch0_data, ch1_data;                 // Variables for 16-bit channel data
    char uart_buffer[50];
    while (1) {
        uint16_t ch0_data, ch1_data;
        float lux, ratio, cpl;
        uint8_t gain = 25;  // Example gain multiplier
        float integration_time = 300.0; // Example integration time in ms

        // Read CH0 and CH1 data
        ch0_data = read_tsl2591_data(&hi2c1, 0x14, 0x15); // CH0 (Full Spectrum)
        ch1_data = read_tsl2591_data(&hi2c1, 0x16, 0x17); // CH1 (Infrared)

        // Calculate ratio
        if (ch0_data == 0) {
            lux = 0.0f; // Avoid divide-by-zero
        } else {
            ratio = (float)ch1_data / (float)ch0_data;

            // Calculate CPL
            cpl = (integration_time * gain) / 408.0;

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

        // Print the results
        // Scale the float by 100 to preserve two decimal places
        int lux_int = (int)(lux * 100);

        // Print as an integer
        printf("Lux: %d.%02d\r\n", lux_int / 100, lux_int % 100);


        // Delay for readability
        HAL_Delay(100);
    }
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

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI;
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
  HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_RESET);

  /*Configure GPIO pin : B1_Pin */
  GPIO_InitStruct.Pin = B1_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_IT_FALLING;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(B1_GPIO_Port, &GPIO_InitStruct);

  /*Configure GPIO pin : LD2_Pin */
  GPIO_InitStruct.Pin = LD2_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(LD2_GPIO_Port, &GPIO_InitStruct);

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
