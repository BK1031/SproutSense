import ingest.service.log as log_service
from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from ingest.service.log import (
    get_all_system_logs,
    get_all_mqtt_logs
)
import datetime

router = APIRouter(
    prefix="/logs",
    tags=["Log"]
)

class SystemLogResponse(BaseModel):
    id: int
    message: str
    created_at: str

class MqttLogResponse(BaseModel):
    id: int
    topic: str
    message: str
    created_at: str

@router.get("/system", response_model=List[SystemLogResponse])
async def get_system_logs():
    """Get all system logs"""
    logs = get_all_system_logs()
    return [
        SystemLogResponse(
            id=log.id,
            message=log.message,
            created_at=log.created_at.astimezone(datetime.timezone.utc).isoformat()
        )
        for log in logs
    ]

@router.get("/mqtt", response_model=List[MqttLogResponse])
async def get_mqtt_logs():
    """Get all MQTT logs"""
    logs = get_all_mqtt_logs()
    return [
        MqttLogResponse(
            id=log.id,
            topic=log.topic,
            message=log.message,
            created_at=log.created_at.astimezone(datetime.timezone.utc).isoformat()
        )
        for log in logs
    ]

