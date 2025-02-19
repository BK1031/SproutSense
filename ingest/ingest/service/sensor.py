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