import datetime
from ingest.models.bps import BPS
from ingest.database.db import get_db
from sqlalchemy import func

def save_bps(bsid: int, value: float) -> BPS:
    """Save a BPS value to the database"""
    db = get_db()
    bps = BPS()
    bps.bsid = bsid
    bps.value = value
    bps.created_at = datetime.datetime.now()
    db.add(bps)
    db.commit()
    return bps

def get_current_average_bps() -> float:
    """Get the current average BPS value for all base stations"""
    db = get_db()
    bps = db.query(BPS.value).distinct(BPS.bsid).order_by(BPS.bsid, BPS.created_at.desc()).from_self().with_entities(func.avg(BPS.value)).scalar()
    return bps.value if bps else 0.0

def get_total_bps() -> float:
    """Get the total BPS value for all base stations"""
    db = get_db()
    bps = db.query(BPS.value).distinct(BPS.bsid).order_by(BPS.bsid, BPS.created_at.desc()).from_self().with_entities(func.sum(BPS.value)).scalar()
    return bps.value if bps else 0.0

def get_current_bps_for_bsid(bsid: int) -> float:
    """Get the current BPS value for a base station"""
    db = get_db()
    bps = db.query(BPS).filter(BPS.bsid == bsid).order_by(BPS.created_at.desc()).first()
    return bps.value if bps else 0.0

def get_average_bps_for_bsid(bsid: int) -> float:
    """Get the average BPS value for a base station"""
    db = get_db()
    bps = db.query(BPS.value).filter(BPS.bsid == bsid).order_by(BPS.created_at.desc()).from_self().with_entities(func.avg(BPS.value)).scalar()
    return bps.value if bps else 0.0

def get_total_bps_for_bsid(bsid: int) -> float:
    """Get the total BPS value for a base station"""
    db = get_db()
    bps = db.query(BPS.value).filter(BPS.bsid == bsid).order_by(BPS.created_at.desc()).from_self().with_entities(func.sum(BPS.value)).scalar()
    return bps.value if bps else 0.0

def get_bps_for_bsid_and_duration(bsid: int, duration: int) -> list[BPS]:
    """Get the BPS values for a base station for a given duration in minutes"""
    db = get_db()
    bps = db.query(BPS).filter(BPS.bsid == bsid, BPS.created_at > datetime.datetime.now() - datetime.timedelta(minutes=duration)).order_by(BPS.created_at.asc()).all()
    return bps