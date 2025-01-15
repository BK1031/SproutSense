from flask import Flask
from flask_cors import CORS
from ingest.routes import hello_bp


app = Flask(__name__)
app.register_blueprint(hello_bp)


CORS(app, supports_credentials=True) 