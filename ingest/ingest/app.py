from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)

    # Register blueprints
    from ingest.routes.ping import ping_bp
    app.register_blueprint(ping_bp)

    CORS(app, supports_credentials=True)

    return app