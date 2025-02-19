from sqlalchemy import Column, Integer, String, Float, DateTime
from ingest.models.base import Base

class SensorModule(Base):
    __tablename__ = 'sensor_module'
    
    id = Column(Integer, primary_key=True, autoincrement=False)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    last_ping = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False)
