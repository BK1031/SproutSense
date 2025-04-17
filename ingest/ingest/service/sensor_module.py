import datetime
from ingest.models.sensor_module import SensorModule
from ingest.database.db import get_db

def create_sensor_module_if_not_exists(id: int) -> SensorModule:
    """Create a new sensor module if it doesn't exist"""
    db = get_db()
    sensor_module = db.query(SensorModule).filter(SensorModule.id == id).first()
    if not sensor_module:
        create_sensor_module(id, f"Sensor Module {id}")
    return sensor_module

def create_sensor_module(id: int, name: str) -> SensorModule:
    """Create a new sensor module"""
    db = get_db()
    sensor_module = SensorModule()
    sensor_module.id = id
    sensor_module.name = name
    sensor_module.latitude = 0.0
    sensor_module.longitude = 0.0
    sensor_module.last_ping = datetime.datetime.now()
    sensor_module.created_at = datetime.datetime.now()
    db.add(sensor_module)
    db.commit()
    return sensor_module

def get_sensor_module(id: int) -> SensorModule:
    """Get a sensor module by ID"""
    db = get_db()
    return db.query(SensorModule).filter(SensorModule.id == id).first()

def get_all_sensor_modules() -> list[SensorModule]:
    """Get all sensor modules"""
    db = get_db()
    return db.query(SensorModule).all()

def update_sensor_module(id: int, **kwargs) -> SensorModule:
    """Update a sensor module's attributes"""
    db = get_db()
    sensor_module = get_sensor_module(id)
    if sensor_module:
        for key, value in kwargs.items():
            if hasattr(sensor_module, key):
                setattr(sensor_module, key, value)
        sensor_module.last_ping = datetime.datetime.now()
        db.commit()
    return sensor_module

def delete_sensor_module(id: int) -> bool:
    """Delete a sensor module"""
    db = get_db()
    sensor_module = get_sensor_module(id)
    if sensor_module:
        db.delete(sensor_module)
        db.commit()
        return True
    return False

def update_sensor_module_ping(id: int) -> SensorModule:
    """Update the last_ping time of a sensor module"""
    db = get_db()
    sensor_module = get_sensor_module(id)
    if sensor_module:
        sensor_module.last_ping = datetime.datetime.now()
        db.commit()
    return sensor_module
