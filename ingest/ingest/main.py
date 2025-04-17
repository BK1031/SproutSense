from ingest.database.db import init_db
from ingest.mqtt.mqtt import init_mqtt
from ingest.routes import ping, query, bps, sensor_module, base_station, log
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
    app.include_router(sensor_module.router)
    app.include_router(base_station.router)
    app.include_router(log.router)
    return app

def main():
    init_db()
    init_mqtt()
    app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=PORT)

if __name__ == "__main__":
    main()