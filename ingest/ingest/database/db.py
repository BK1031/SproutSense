from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from ingest.config.config import (
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_NAME
)
from ingest.models.base import Base
from ingest.models import base_station, sensor, sensor_module, log, bps

DATABASE_URL = f"postgresql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"

db_session = None

def init_db():
    """Initialize the database session"""
    if not DATABASE_HOST:
        raise ValueError("DATABASE_HOST is not set")
    elif not DATABASE_PORT:
        raise ValueError("DATABASE_PORT is not set")
    elif not DATABASE_USER:
        raise ValueError("DATABASE_USER is not set")
    elif not DATABASE_PASSWORD:
        raise ValueError("DATABASE_PASSWORD is not set")
    elif not DATABASE_NAME:
        raise ValueError("DATABASE_NAME is not set")
    else:
        global db_session
        engine = create_engine(
            DATABASE_URL,
            connect_args={
                'options': '-c timezone=UTC'
            }
        )
        db_session = scoped_session(
            sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=engine
            )
        )
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("Database initialized")

def get_db():
    """Get the database session"""
    if not db_session:
        raise ValueError("Database session is not initialized")
    return db_session
        
def shutdown_session(exception=None):
    """Remove the session at the end of request"""
    db_session.remove()
