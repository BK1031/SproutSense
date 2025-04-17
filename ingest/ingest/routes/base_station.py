from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
import ingest.service.base_station as bs_service

router = APIRouter(
    prefix="/base-station",
    tags=["Base Station"]
)

class BaseStationBase(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float

class BaseStationResponse(BaseStationBase):
    last_ping: str
    created_at: str

class BaseStationUpdate(BaseModel):
    name: str = None
    latitude: float = None
    longitude: float = None

@router.get("/{id}", response_model=BaseStationResponse)
async def get_base_station(id: int):
    """Get a base station by ID"""
    base_station = bs_service.get_base_station(id)
    if not base_station:
        raise HTTPException(status_code=404, detail="Base station not found")
    return BaseStationResponse(
        id=base_station.id,
        name=base_station.name,
        latitude=base_station.latitude,
        longitude=base_station.longitude,
        last_ping=base_station.last_ping.isoformat(),
        created_at=base_station.created_at.isoformat()
    )

@router.get("", response_model=List[BaseStationResponse])
async def list_base_stations():
    """Get all base stations"""
    base_stations = bs_service.get_all_base_stations()
    return [
        BaseStationResponse(
            id=base_station.id,
            name=base_station.name,
            latitude=base_station.latitude,
            longitude=base_station.longitude,
            last_ping=base_station.last_ping.isoformat(),
            created_at=base_station.created_at.isoformat()
        )
        for base_station in base_stations
    ]

@router.patch("/{id}", response_model=BaseStationResponse)
async def update_base_station(id: int, update: BaseStationUpdate):
    """Update a base station"""
    base_station = bs_service.update_base_station(id, **update.model_dump(exclude_unset=True))
    if not base_station:
        raise HTTPException(status_code=404, detail="Base station not found")
    return BaseStationResponse(
        id=base_station.id,
        name=base_station.name,
        latitude=base_station.latitude,
        longitude=base_station.longitude,
        last_ping=base_station.last_ping.isoformat(),
        created_at=base_station.created_at.isoformat()
    )

@router.delete("/{id}")
async def delete_base_station(id: int):
    """Delete a base station"""
    success = bs_service.delete_base_station(id)
    if not success:
        raise HTTPException(status_code=404, detail="Base station not found")
    return {"message": "Base station deleted successfully"}