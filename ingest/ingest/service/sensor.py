import datetime
from ingest.service.sensor_module import update_sensor_module
from ingest.models.sensor import Sensor
from ingest.database.db import get_db

def save_temperature(bsid, smid, value, millis):
    # no scaling needed
    save_sensor_data(bsid, smid, "temperature", value, millis)

def save_humidity(bsid, smid, value, millis):
    # no scaling needed (percent float between 0 and 100)
    save_sensor_data(bsid, smid, "humidity", value, millis)

def save_lux(bsid, smid, lux_0, lux_1, millis):
    integration_time = 300
    gain = 25
    
    if lux_0 == 0:
        lux = 0.0
    else:
        ratio = float(lux_1) / float(lux_0)
        
        # Calculate CPL (counts per lux)
        cpl = (integration_time * gain) / 408.0
        
        # Determine lux based on ratio thresholds
        if ratio <= 0.5:
            lux = ((0.0304 * lux_0) - (0.062 * lux_0 * (ratio ** 1.4))) / cpl
        elif ratio <= 0.61:
            lux = ((0.0224 * lux_0) - (0.031 * lux_1)) / cpl
        elif ratio <= 0.80:
            lux = ((0.0128 * lux_0) - (0.0153 * lux_1)) / cpl
        elif ratio <= 1.30:
            lux = ((0.00146 * lux_0) - (0.00112 * lux_1)) / cpl
        else:
            lux = 0.0  # Very high ratio indicates invalid reading
    
    save_sensor_data(bsid, smid, "lux", lux, millis)

def save_nitrogen(bsid, smid, value, millis):
    save_sensor_data(bsid, smid, "nitrogen", value, millis)

def save_soil_moisture(bsid, smid, value, millis):
    voltage = (value * 3.3) / 4095.0
    score = 0.0
    num = 0.0
    
    if 0.0 <= voltage < 1.1:
        num = voltage * 10 - 1
    elif 1.1 <= voltage < 1.3:
        num = voltage * 25 - 17.5
    elif 1.3 <= voltage < 1.82:
        num = voltage * 48.08 - 47.5
    elif 1.82 <= voltage <= 2.2:
        num = voltage * 26.32 - 7.89
    else:
        # out of range
        num = -1
    
    score = num / 50 * 100
    save_sensor_data(bsid, smid, "soil_moisture", score, millis)

def save_phosphorus(bsid, smid, value, millis):
    save_sensor_data(bsid, smid, "phosphorus", value, millis)

def save_potassium(bsid, smid, value, millis):
    save_sensor_data(bsid, smid, "potassium", value, millis)

def save_latitude(bsid, smid, value, lat_dir, millis):
    return

def save_longitude(bsid, smid, value, lon_dir, millis):
    return

def convert_to_decimal_degrees(raw_coord, direction):
    # Split degrees and minutes
    if not raw_coord or '.' not in raw_coord:
        return None  # invalid data

    # Latitude has 2-digit degrees, Longitude has 3-digit degrees
    degree_length = 2 if direction in ['N', 'S'] else 3

    degrees = int(raw_coord[:degree_length])
    minutes = float(raw_coord[degree_length:])

    decimal_degrees = degrees + (minutes / 60)

    # South and West are negative
    if direction in ['S', 'W']:
        decimal_degrees *= -1

    return decimal_degrees

def save_sensor_data(bsid, smid, name, value, millis):
    db = get_db()
    model = Sensor()
    model.bsid = bsid
    model.smid = smid
    model.name = name
    model.value = value
    model.millis = millis
    model.created_at = datetime.datetime.now(datetime.timezone.utc)
    db.add(model)
    db.commit()

def get_sensor_data_by_id(id: int) -> Sensor:
    """Get sensor data by ID"""
    db = get_db()
    return db.query(Sensor).filter(Sensor.id == id).first()

def get_sensor_data_by_smid_and_millis(smid: int, millis: int) -> Sensor:
    """Get sensor data by sensor module ID and millisecond timestamp"""
    db = get_db()
    return db.query(Sensor).filter(Sensor.smid == smid, Sensor.millis == millis).order_by(Sensor.created_at.desc()).first()

def get_sensor_data_by_bsid_and_smid(bsid: int, smid: int) -> list[Sensor]:
    """Get sensor data by base station ID and sensor module ID"""
    db = get_db()
    return db.query(Sensor).filter(Sensor.bsid == bsid, Sensor.smid == smid).all()

def get_sensor_data_by_bsid(bsid: int) -> list[Sensor]:
    """Get sensor data by base station ID"""
    db = get_db()
    return db.query(Sensor).filter(Sensor.bsid == bsid).all()

def get_sensor_data_by_smid(smid: int) -> list[Sensor]:
    """Get sensor data by sensor module ID"""
    db = get_db()
    return db.query(Sensor).filter(Sensor.smid == smid).all()

def get_all_sensor_data() -> list[Sensor]:
    """Get all sensor data"""
    db = get_db()
    return db.query(Sensor).all()