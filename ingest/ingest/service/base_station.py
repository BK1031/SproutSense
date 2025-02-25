import datetime
from ingest.models.base_station import BaseStation
from ingest.database.db import get_db

def create_base_station(id: int, name: str) -> BaseStation:
    """Create a new base station"""
    db = get_db()
    base_station = BaseStation()
    base_station.id = id
    base_station.name = name
    base_station.latitude = 0.0
    base_station.longitude = 0.0
    base_station.last_ping = datetime.datetime.now()
    base_station.created_at = datetime.datetime.now()
    db.add(base_station)
    db.commit()
    return base_station

def get_base_station(id) -> BaseStation:
    """Get a base station by ID"""
    db = get_db()
    return db.query(BaseStation).filter(BaseStation.id == id).first()

def get_all_base_stations() -> list[BaseStation]:
    """Get all base stations"""
    db = get_db()
    return db.query(BaseStation).all()

def update_base_station(id: int, **kwargs) -> BaseStation:
    """Update a base station's attributes"""
    db = get_db()
    base_station = get_base_station(id)
    if base_station:
        for key, value in kwargs.items():
            if hasattr(base_station, key):
                setattr(base_station, key, value)
        base_station.last_ping = datetime.datetime.now()
        db.commit()
    return base_station

def delete_base_station(id: int) -> bool:
    """Delete a base station"""
    db = get_db()
    base_station = get_base_station(id)
    if base_station:
        db.delete(base_station)
        db.commit()
        return True
    return False

def update_base_station_ping(id: int) -> BaseStation:
    """Update the last_ping time of a base station"""
    db = get_db()
    base_station = get_base_station(id)
    if base_station:
        base_station.last_ping = datetime.datetime.now()
        db.commit()
    return base_station
