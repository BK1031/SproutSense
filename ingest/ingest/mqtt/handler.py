def handle_message(topic, payload):
    print(f"Received message on {topic}: {', '.join([f'0x{byte:02x}' for byte in payload])}")
    if len(payload) < 4:
        print(f"Message not at least 4 bytes")
        return
    base_station_id = int(topic.split("/")[1])
    sensor_module_id = int(payload[0:2])
    message_id = int(payload[2])
    print(f"Base station ID: {base_station_id}, Sensor module ID: {sensor_module_id}, Message ID: {message_id}")
    if message_id == 1:
        temperature = int(payload[3])
        humidity = int(payload[4])
        lux_0 = int(payload[5:7])
        lux_1 = int(payload[7:10])
        
        print(f"Temperature: {temperature}°C")
        print(f"Humidity: {humidity}%") 
        print(f"Lux sensor 0: {lux_0}")
        print(f"Lux sensor 1: {lux_1}")
    elif message_id == 2:
        temperature = int(payload[3])
        humidity = int(payload[4])
        lux_0 = int(payload[5:7])
        lux_1 = int(payload[7:10])
        nitrogen = int(payload[9:11])
        soil_moisture = int(payload[11:15])
        
        print(f"Temperature: {temperature}°C")
        print(f"Humidity: {humidity}%")
        print(f"Lux sensor 0: {lux_0}")
        print(f"Lux sensor 1: {lux_1}")
        print(f"Nitrogen: {nitrogen}")
        print(f"Soil moisture: {soil_moisture}")
    elif message_id == 3:
        temperature = int(payload[3])
        humidity = int(payload[4])
        lux_0 = int(payload[5:7])
        lux_1 = int(payload[7:10])
        nitrogen = int(payload[9:11])
        soil_moisture = int(payload[11:15])
        phosphorous = int(payload[15:17])
        potassium = int(payload[17:19])
        
        print(f"Temperature: {temperature}°C")
        print(f"Humidity: {humidity}%")
        print(f"Lux sensor 0: {lux_0}")
        print(f"Lux sensor 1: {lux_1}")
        print(f"Nitrogen: {nitrogen}")
        print(f"Soil moisture: {soil_moisture}")
        print(f"Phosphorous: {phosphorous}")
        print(f"Potassium: {potassium}")
    elif message_id == 4:
        temperature = int(payload[3])
        humidity = int(payload[4])
        lux_0 = int(payload[5:7])
        lux_1 = int(payload[7:10])
        nitrogen = int(payload[9:11])
        soil_moisture = int(payload[11:15])
        phosphorous = int(payload[15:17])
        potassium = int(payload[17:19])
        
        print(f"Temperature: {temperature}°C")
        print(f"Humidity: {humidity}%")
        print(f"Lux sensor 0: {lux_0}")
        print(f"Lux sensor 1: {lux_1}")
        print(f"Nitrogen: {nitrogen}")
        print(f"Soil moisture: {soil_moisture}")
        print(f"Phosphorous: {phosphorous}")
        print(f"Potassium: {potassium}")
    else:
        print(f"Unknown message ID: {message_id}")