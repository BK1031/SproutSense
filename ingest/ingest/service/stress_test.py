import datetime
from ingest.models.stress_test import StressTest
from ingest.database.db import get_db

def save_stress_test(bsid: int, smid: int, generated_at: int, sent_at: int):
    """Save stress test data to database"""
    db = get_db()
    model = StressTest()
    model.bsid = bsid
    model.smid = smid
    model.generated_at = generated_at
    model.sent_at = sent_at
    model.latency = sent_at - generated_at
    model.created_at = datetime.datetime.now()
    db.add(model)
    db.commit()

def get_stress_test_by_id(id: int) -> StressTest:
    """Get stress test data by ID"""
    db = get_db()
    return db.query(StressTest).filter(StressTest.id == id).first()

def get_stress_tests_by_smid(smid: int) -> list[StressTest]:
    """Get all stress test data for a sensor module"""
    db = get_db()
    return db.query(StressTest).filter(StressTest.smid == smid).all()

def get_stress_tests_by_bsid(bsid: int) -> list[StressTest]:
    """Get all stress test data for a base station"""
    db = get_db()
    return db.query(StressTest).filter(StressTest.bsid == bsid).all()
