from ingest.app import create_app
from ingest.database.db import init_db
from ingest.mqtt.mqtt import init_mqtt

def main():
    init_db()
    init_mqtt()
    app = create_app()
    app.run(debug=True)

if __name__ == "__main__":
    main()