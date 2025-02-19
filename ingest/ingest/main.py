from . import app, db
from ingest.models.sensor_data import SensorData
from ingest.models.base_station import BaseStation
from ingest.models.sensor_readings import SensorReadings
from ingest.models.sensor_module import SensorModule

def main():
    with app.app_context():
        db.create_all()
    app.run(debug=True)

if __name__ == "__main__":
    main()