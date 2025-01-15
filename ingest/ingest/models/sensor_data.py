from  .. import db

class SensorData(db.Model):
    __tablename__ = 'sensor_data'
    id = db.Column(db.Integer, primary_key=True)
    nitrogen = db.Column(db.Integer, nullable=False)
    phosphorus = db.Column(db.Integer, nullable=False)
    potassium = db.Column(db.Integer, nullable=False)
    humidity = db.Column(db.Integer, nullable=False)
    soilmoisture = db.Column(db.Integer, nullable=False)
    uv = db.Column(db.Integer, nullable=False)