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
    # Get latest value for each bsid
    subquery = db.query(
        BPS.bsid,
        func.max(BPS.created_at).label('max_created_at')
    ).group_by(BPS.bsid).subquery()
    
    # Get average of latest values
    bps = db.query(func.avg(BPS.value)).join(
        subquery,
        (BPS.bsid == subquery.c.bsid) & (BPS.created_at == subquery.c.max_created_at)
    ).scalar()
    
    return bps if bps else 0.0

def get_total_bps() -> float:
    """Get the current total BPS value for all base stations"""
    db = get_db()
    # Get latest value for each bsid
    subquery = db.query(
        BPS.bsid,
        func.max(BPS.created_at).label('max_created_at')
    ).group_by(BPS.bsid).subquery()
    
    # Get sum of latest values
    bps = db.query(func.sum(BPS.value)).join(
        subquery,
        (BPS.bsid == subquery.c.bsid) & (BPS.created_at == subquery.c.max_created_at)
    ).scalar()
    
    return bps if bps else 0.0

def get_current_bps_for_bsid(bsid: int) -> float:
    """Get the current BPS value for a base station"""
    db = get_db()
    bps = db.query(BPS).filter(
        BPS.bsid == bsid
    ).order_by(BPS.created_at.desc()).first()
    return bps.value if bps else 0.0

def get_bps_for_bsid_and_duration(bsid: int, duration: int = None) -> list[BPS]:
    """Get the BPS values for a base station for a given duration in minutes"""
    db = get_db()
    if duration is None:
        bps = db.query(BPS).filter(
            BPS.bsid == bsid
        ).order_by(BPS.created_at.asc()).all()
    else:
        bps = db.query(BPS).filter(
            BPS.bsid == bsid,
            BPS.created_at > datetime.datetime.now() - datetime.timedelta(minutes=duration)
        ).order_by(BPS.created_at.asc()).all()
    return bps