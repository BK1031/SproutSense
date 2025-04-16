from ingest.database.db import init_db
from ingest.config.config import ENV, PORT
from ingest.mqtt.mqtt import init_mqtt

from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)

    # Register blueprints
    from ingest.routes.ping import ping_bp
    app.register_blueprint(ping_bp)

    from ingest.routes.api import api_bp 
    app.register_blueprint(api_bp)

    CORS(app, supports_credentials=True)

    return app

def main():
    init_db()
    init_mqtt()
    app = create_app()
    app.run(host='0.0.0.0', port=PORT)

if __name__ == "__main__":
    main()