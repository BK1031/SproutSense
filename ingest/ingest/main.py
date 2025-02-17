from . import app, db
from ingest.models.sensor_data import SensorData

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)

