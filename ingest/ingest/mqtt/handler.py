from datetime import datetime
from ingest.ingest.service.base_station import create_base_station_if_not_exists, update_base_station_ping
from ingest.ingest.service.sensor_module import create_sensor_module_if_not_exists, update_sensor_module_ping
from ingest.service.sensor import save_humidity, save_lux, save_nitrogen, save_phosphorus, save_potassium, save_soil_moisture, save_temperature, get_sensor_data_by_smid_and_millis

def handle_message(topic, payload):
    print('--------------------------------')
    print(f"Received message on {topic}: {', '.join([f'0x{byte:02x}' for byte in payload])}")
    if len(payload) < 4:
        print(f"Message not at least 4 bytes")
        return
    base_station_id = int(topic.split("/")[1])
    message_id = int(payload[0])
    sensor_module_id = int.from_bytes(payload[1:3], byteorder='big')
    millis = int.from_bytes(payload[3:7], byteorder='big')

    if check_duplicate_message(sensor_module_id, millis):
        print(f"Duplicate message detected (skipping) Sensor Module ID: {sensor_module_id}, Millis: {millis}")
        return
    
    create_base_station_if_not_exists(base_station_id)
    create_sensor_module_if_not_exists(sensor_module_id)
    update_base_station_ping(base_station_id)
    update_sensor_module_ping(sensor_module_id)

    print('')
    print(f"Base station ID: {base_station_id}, Sensor module ID: {sensor_module_id}, Message ID: {message_id}, Millis: {millis}")
    if message_id == 1:
        temperature = int.from_bytes(payload[7:8], byteorder='big')
        humidity = int.from_bytes(payload[8:9], byteorder='big')
        lux_0 = int.from_bytes(payload[9:11], byteorder='big')
        lux_1 = int.from_bytes(payload[11:13], byteorder='big')
        
        save_temperature(base_station_id, sensor_module_id, temperature, millis)
        save_humidity(base_station_id, sensor_module_id, humidity, millis)
        save_lux(base_station_id, sensor_module_id, lux_0, lux_1, millis)

    elif message_id == 2:
        temperature = int.from_bytes(payload[7:8], byteorder='big')
        humidity = int.from_bytes(payload[8:9], byteorder='big')
        lux_0 = int.from_bytes(payload[9:11], byteorder='big')
        lux_1 = int.from_bytes(payload[11:13], byteorder='big')
        nitrogen = int.from_bytes(payload[13:15], byteorder='big')
        soil_moisture = int.from_bytes(payload[15:19], byteorder='big')

        save_temperature(base_station_id, sensor_module_id, temperature, millis)
        save_humidity(base_station_id, sensor_module_id, humidity, millis)
        save_lux(base_station_id, sensor_module_id, lux_0, lux_1, millis)
        save_nitrogen(base_station_id, sensor_module_id, nitrogen, millis)
        save_soil_moisture(base_station_id, sensor_module_id, soil_moisture, millis)
    
    elif message_id == 3:
        temperature = int.from_bytes(payload[7:8], byteorder='big')
        humidity = int.from_bytes(payload[8:9], byteorder='big')
        lux_0 = int.from_bytes(payload[9:11], byteorder='big')
        lux_1 = int.from_bytes(payload[11:13], byteorder='big')
        nitrogen = int.from_bytes(payload[13:15], byteorder='big')
        soil_moisture = int.from_bytes(payload[15:19], byteorder='big')

        save_temperature(base_station_id, sensor_module_id, temperature, millis)
        save_humidity(base_station_id, sensor_module_id, humidity, millis)
        save_lux(base_station_id, sensor_module_id, lux_0, lux_1, millis)
        save_nitrogen(base_station_id, sensor_module_id, nitrogen, millis)
        save_soil_moisture(base_station_id, sensor_module_id, soil_moisture, millis)
    
    elif message_id == 4:
        temperature = int.from_bytes(payload[7:8], byteorder='big')
        humidity = int.from_bytes(payload[8:9], byteorder='big')
        lux_0 = int.from_bytes(payload[9:11], byteorder='big')
        lux_1 = int.from_bytes(payload[11:13], byteorder='big')
        nitrogen = int.from_bytes(payload[13:15], byteorder='big')
        soil_moisture = int.from_bytes(payload[15:19], byteorder='big')
        phosphorus = int.from_bytes(payload[19:21], byteorder='big')
        potassium = int.from_bytes(payload[21:23], byteorder='big')

        save_temperature(base_station_id, sensor_module_id, temperature, millis)
        save_humidity(base_station_id, sensor_module_id, humidity, millis)
        save_lux(base_station_id, sensor_module_id, lux_0, lux_1, millis)
        save_nitrogen(base_station_id, sensor_module_id, nitrogen, millis)
        save_soil_moisture(base_station_id, sensor_module_id, soil_moisture, millis)
        save_phosphorus(base_station_id, sensor_module_id, phosphorus, millis)
        save_potassium(base_station_id, sensor_module_id, potassium, millis)
        
    else:
        print(f"Unknown message ID: {message_id}")

def check_duplicate_message(sensor_module_id, millis) -> bool:
    sensor_data = get_sensor_data_by_smid_and_millis(sensor_module_id, millis)
    if sensor_data:
        if sensor_data.created_at.timestamp() > datetime.now().timestamp() - 5:
            return True
    return False