from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
import ingest.service.bps as bps_service
import datetime

router = APIRouter(
    prefix="/bps",
    tags=["BPS"]
)

class BPSResponse(BaseModel):
    bsid: int
    value: float
    created_at: str

@router.get("/average")
async def get_average_bps():
    """
    Get the current average BPS value across all base stations.
    
    Returns:
    --------
    float
        The average BPS value
    """
    value = bps_service.get_current_average_bps()
    return {"value": value}

@router.get("/total")
async def get_total_bps():
    """
    Get the total BPS value across all base stations.
    
    Returns:
    --------
    float
        The total BPS value
    """
    value = bps_service.get_total_bps()
    return {"value": value}

@router.get("/{bsid}/current")
async def get_current_bps(bsid: int):
    """
    Get the current BPS value for a specific base station.
    
    Parameters:
    -----------
    bsid : int
        The base station ID
        
    Returns:
    --------
    float
        The current BPS value
    """
    value = bps_service.get_current_bps_for_bsid(bsid)
    return {"value": value}

@router.get("/{bsid}/history")
async def get_bps_history(bsid: int, duration: int = None):
    """
    Get the BPS history for a specific base station over a duration.
    
    Parameters:
    -----------
    bsid : int
        The base station ID
    duration : int
        Duration in minutes to look back
        
    Returns:
    --------
    List[BPSResponse]
        List of BPS records
    """
    bps_list = bps_service.get_bps_for_bsid_and_duration(bsid, duration)
    return [
        BPSResponse(
            bsid=bps.bsid,
            value=bps.value,
            created_at=bps.created_at.astimezone(datetime.timezone.utc).isoformat()
        )
        for bps in bps_list
    ]
