import datetime
from ingest.models.sensor import Sensor
from ingest.database.db import db_session

def save_temperature(bsid, smid, value):
    # TODO: real scaling
    scaled_value = value * 100
    save_sensor_data(bsid, smid, "temperature", scaled_value)

def save_humidity(bsid, smid, value):
    # TODO: real scaling
    scaled_value = value * 100
    save_sensor_data(bsid, smid, "humidity", scaled_value)

def save_sensor_data(bsid, smid, name, value):
    model = Sensor()
    model.id = int(datetime.datetime.now().timestamp() * 1000000)
    model.bsid = bsid
    model.smid = smid
    model.name = name
    model.value = value
    model.created_at = datetime.datetime.now()
    db_session.add(model)
    db_session.commit()

def get_sensor_data_by_id(id: int) -> Sensor:
    """Get sensor data by ID"""
    return db_session.query(Sensor).filter(Sensor.id == id).first()

def get_sensor_data_by_smid_and_millis(smid: int, millis: int) -> Sensor:
    """Get sensor data by sensor module ID and millisecond timestamp"""
    return db_session.query(Sensor).filter(Sensor.smid == smid, Sensor.millis == millis).order_by(Sensor.created_at.desc()).first()

def get_sensor_data_by_bsid_and_smid(bsid: int, smid: int) -> list[Sensor]:
    """Get sensor data by base station ID and sensor module ID"""
    return db_session.query(Sensor).filter(Sensor.bsid == bsid, Sensor.smid == smid).all()

def get_sensor_data_by_bsid(bsid: int) -> list[Sensor]:
    """Get sensor data by base station ID"""
    return db_session.query(Sensor).filter(Sensor.bsid == bsid).all()

def get_sensor_data_by_smid(smid: int) -> list[Sensor]:
    """Get sensor data by sensor module ID"""
    return db_session.query(Sensor).filter(Sensor.smid == smid).all()

def get_all_sensor_data() -> list[Sensor]:
    """Get all sensor data"""
    return db_session.query(Sensor).all()