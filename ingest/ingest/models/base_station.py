from ingest.database.db import db
from ingest.models.base import Base

class BaseStation(Base):
    __tablename__ = 'base_station'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=False)
    name = db.Column(db.String, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    last_ping = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
