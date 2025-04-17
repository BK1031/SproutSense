from ingest.database.db import init_db
from ingest.mqtt.mqtt import init_mqtt
from ingest.routes import ping, query, bps
from ingest.service.query import query_latest_sensors
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ingest.config.config import VERSION, PORT
import uvicorn
def create_app():
    app = FastAPI(
        title="SproutSense Ingest Service",
        description="API Documentation",
        version=VERSION
    )
    app.include_router(ping.router)
    app.include_router(query.router)
    app.include_router(bps.router)
    return app

def main():
    init_db()
    init_mqtt()
    app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=PORT)

if __name__ == "__main__":
    main()