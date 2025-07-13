from dotenv import load_dotenv
import os

# Load environment variables from .env file if it exists
load_dotenv()

VERSION: str = "1.2.0"
PORT: int = int(os.getenv('PORT', 5050))

DATABASE_HOST: str = os.getenv('DATABASE_HOST')
DATABASE_PORT: int = int(os.getenv('DATABASE_PORT'))
DATABASE_USER: str = os.getenv('DATABASE_USER')
DATABASE_PASSWORD: str = os.getenv('DATABASE_PASSWORD')
DATABASE_NAME: str = os.getenv('DATABASE_NAME')

MQTT_HOST: str = os.getenv('MQTT_HOST')
MQTT_PORT: int = int(os.getenv('MQTT_PORT'))
