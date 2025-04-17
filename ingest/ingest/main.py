from ingest.database.db import init_db
from ingest.config.config import ENV, PORT
from ingest.mqtt.mqtt import init_mqtt
from ingest.service.query import query_latest_sensors
from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)

    # Register blueprints
    from ingest.routes.ping import ping_bp
    app.register_blueprint(ping_bp)

    CORS(app, supports_credentials=True)

    return app

def main():
    init_db()
    # init_mqtt()
    # app = create_app()
    # app.run(host='0.0.0.0', port=PORT)
    df = query_latest_sensors(smid=5, sensors=['temperature', 'humidity', 'soil_moisture'])
    print(df)

if __name__ == "__main__":
    main()