from ingest.models.base import Base
from sqlalchemy import BigInteger, Column, Integer, String, Float, DateTime

class StressTest(Base):
    __tablename__ = 'stress_test'
    
    id = Column(BigInteger, primary_key=True)
    bsid = Column(Integer, nullable=False)
    smid = Column(Integer, nullable=False)
    generated_at = Column(Integer, nullable=False)
    sent_at = Column(Integer, nullable=False)
    latency = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False)