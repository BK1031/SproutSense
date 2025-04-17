from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from ingest.service.sensor_module import (
    get_sensor_module,
    get_all_sensor_modules,
    update_sensor_module,
    delete_sensor_module
)
import datetime
router = APIRouter(
    prefix="/sensor-module",
    tags=["Sensor Module"]
)

class SensorModuleBase(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float

class SensorModuleResponse(SensorModuleBase):
    last_ping: str
    created_at: str

class SensorModuleUpdate(BaseModel):
    name: str = None
    latitude: float = None
    longitude: float = None

@router.get("/{id}", response_model=SensorModuleResponse)
async def get_module(id: int):
    """Get a sensor module by ID"""
    sensor_module = get_sensor_module(id)
    if not sensor_module:
        raise HTTPException(status_code=404, detail="Sensor module not found")
    return SensorModuleResponse(
        id=sensor_module.id,
        name=sensor_module.name,
        latitude=sensor_module.latitude,
        longitude=sensor_module.longitude,
        last_ping=sensor_module.last_ping.astimezone(datetime.timezone.utc).isoformat(),
        created_at=sensor_module.created_at.astimezone(datetime.timezone.utc).isoformat()
    )

@router.get("", response_model=List[SensorModuleResponse])
async def list_modules():
    """Get all sensor modules"""
    modules = get_all_sensor_modules()
    return [
        SensorModuleResponse(
            id=module.id,
            name=module.name,
            latitude=module.latitude,
            longitude=module.longitude,
            last_ping=module.last_ping.astimezone(datetime.timezone.utc).isoformat(),
            created_at=module.created_at.astimezone(datetime.timezone.utc).isoformat()
        )
        for module in modules
    ]

@router.patch("/{id}", response_model=SensorModuleResponse)
async def update_module(id: int, update: SensorModuleUpdate):
    """Update a sensor module"""
    sensor_module = update_sensor_module(id, **update.model_dump(exclude_unset=True))
    if not sensor_module:
        raise HTTPException(status_code=404, detail="Sensor module not found")
    return SensorModuleResponse(
        id=sensor_module.id,
        name=sensor_module.name,
        latitude=sensor_module.latitude,
        longitude=sensor_module.longitude,
        last_ping=sensor_module.last_ping.astimezone(datetime.timezone.utc).isoformat(),
        created_at=sensor_module.created_at.astimezone(datetime.timezone.utc).isoformat()
    )

@router.delete("/{id}")
async def delete_module(id: int):
    """Delete a sensor module"""
    success = delete_sensor_module(id)
    if not success:
        raise HTTPException(status_code=404, detail="Sensor module not found")
    return {"message": "Sensor module deleted successfully"}