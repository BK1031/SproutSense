from ingest.database.db import db
from ingest.models.base import Base

class Sensor(Base):
    __tablename__ = 'sensor'
    
    id = db.Column(db.Integer, primary_key=True)
    bsid = db.Column(db.Integer, nullable=False)
    smid = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String, nullable=False)
    value = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)