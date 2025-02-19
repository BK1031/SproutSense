from . import app, db
from ingest.models.sensor_data import SensorData
from ingest.models.base_station import BaseStation
from ingest.models.sensor_readings import SensorReadings
from ingest.models.sensor_module import SensorModule



if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)

