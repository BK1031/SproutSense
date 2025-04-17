from ingest.models.base import Base
from sqlalchemy import BigInteger, Column, Integer, String, Float, DateTime

class SystemLog(Base):
    __tablename__ = 'system_log'
    
    id = Column(BigInteger, primary_key=True)
    message = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)


class MqttLog(Base):
    __tablename__ = 'mqtt_log'
    
    id = Column(BigInteger, primary_key=True)
    topic = Column(String, nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)