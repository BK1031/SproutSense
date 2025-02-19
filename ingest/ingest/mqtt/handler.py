def handle_message(topic, payload):
    print(f"Received message on {topic}: {', '.join([f'0x{byte:02x}' for byte in payload])}")
    if len(payload) < 4:
        print(f"Message not at least 4 bytes")
        return
    base_station_id = int(topic.split("/")[1])
    sensor_module_id = payload[0:2]
    message_id = int(payload[2])
    print(f"Base station ID: {base_station_id}, Sensor module ID: {sensor_module_id}, Message ID: {message_id}")
    if message_id == 1:
        temperature = payload[3]
        humidity = payload[4]
        lux_0 = int.from_bytes(payload[5:7], byteorder='big')
        lux_1 = int.from_bytes(payload[7:9], byteorder='big')
        
        print(f"Temperature: {temperature}°C")
        print(f"Humidity: {humidity}%") 
        print(f"Lux sensor 0: {lux_0}")
        print(f"Lux sensor 1: {lux_1}")
    elif message_id == 2:
        temperature = payload[3]
        humidity = payload[4]
        lux_0 = int.from_bytes(payload[5:7], byteorder='big')
        lux_1 = int.from_bytes(payload[7:9], byteorder='big')
        nitrogen = int.from_bytes(payload[9:11], byteorder='big')
        soil_moisture = int.from_bytes(payload[11:15], byteorder='big')
        
        print(f"Temperature: {temperature}°C")
        print(f"Humidity: {humidity}%")
        print(f"Lux sensor 0: {lux_0}")
        print(f"Lux sensor 1: {lux_1}")
        print(f"Nitrogen: {nitrogen}")
        print(f"Soil moisture: {soil_moisture}")
    elif message_id == 3:
        temperature = payload[3]
        humidity = payload[4]
        lux_0 = int.from_bytes(payload[5:7], byteorder='big')
        lux_1 = int.from_bytes(payload[7:9], byteorder='big')
        nitrogen = int.from_bytes(payload[9:11], byteorder='big')
        soil_moisture = int.from_bytes(payload[11:15], byteorder='big')
        phosphorous = int.from_bytes(payload[15:17], byteorder='big')
        potassium = int.from_bytes(payload[17:19], byteorder='big')
        
        print(f"Temperature: {temperature}°C")
        print(f"Humidity: {humidity}%")
        print(f"Lux sensor 0: {lux_0}")
        print(f"Lux sensor 1: {lux_1}")
        print(f"Nitrogen: {nitrogen}")
        print(f"Soil moisture: {soil_moisture}")
        print(f"Phosphorous: {phosphorous}")
        print(f"Potassium: {potassium}")
    elif message_id == 4:
        temperature = payload[3]
        humidity = payload[4]
        lux_0 = int.from_bytes(payload[5:7], byteorder='big')
        lux_1 = int.from_bytes(payload[7:9], byteorder='big')
        nitrogen = int.from_bytes(payload[9:11], byteorder='big')
        soil_moisture = int.from_bytes(payload[11:15], byteorder='big')
        phosphorous = int.from_bytes(payload[15:17], byteorder='big')
        potassium = int.from_bytes(payload[17:19], byteorder='big')
        
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

# def save_sensor_data(base_station_id, sensor_module_id, sensor_name, data):
#     model = Sensor()
#     model.bsid = base_station_id
#     model.smid = sensor_module_id
#     model.name = sensor_name
#     model.value = data
#     model.created_at = datetime.datetime.now()
#     db_session.add(model)
#     db_session.commit()