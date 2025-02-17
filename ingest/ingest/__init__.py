from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

USERNAME = os.getenv('DB_USERNAME')
PASSWORD = os.getenv('DB_PASSWORD')


app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://admin:password@localhost:5432/sprout_sense"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

from ingest.models.sensor_data import SensorData


from ingest.routes import hello_bp, ingest_bp
app.register_blueprint(hello_bp)
app.register_blueprint(ingest_bp)


CORS(app, supports_credentials=True) 