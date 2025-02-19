from  .. import db
from datetime import datetime, timezone

class SensorReadings(db.Model):
    __tablename__ = 'sensor_readings'
    id = db.Column(db.Integer, primary_key=True)
    base_station_id = db.Column(db.Integer, db.ForeignKey('base_station.id'), nullable=False)
    sensor_module_id = db.Column(db.Integer, db.ForeignKey('sensor_module.id'), nullable=False)
    sensor_name = db.Column(db.String, nullable=False)
    sensor_value = db.Column(db.Float, nullable=False)
    time_stamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))