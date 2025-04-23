from ingest.models.base import Base
from sqlalchemy import BigInteger, Column, Integer, String, Float, DateTime

class BPS(Base):
    __tablename__ = 'bps'
    
    id = Column(BigInteger, primary_key=True)
    bsid = Column(Integer, nullable=False)
    value = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False)