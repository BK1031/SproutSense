from ingest.models.base import Base
from sqlalchemy import BigInteger, Column, Integer, String, Float, DateTime

class Sensor(Base):
    __tablename__ = 'sensor'
    
    id = Column(BigInteger, primary_key=True)
    bsid = Column(Integer, nullable=False)
    smid = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    millis = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'smid': self.smid,
            'bsid': self.bsid,
            'name': self.name,
            'value': self.value,
            'millis': self.millis,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }