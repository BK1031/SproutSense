from fastapi import APIRouter, HTTPException, Request
from typing import List
from pydantic import BaseModel
from ingest.service.query import merge_to_largest, query_latest_average_sensors, query_latest_sensors, query_sensors
import datetime

router = APIRouter(
    prefix="/query",
    tags=["Query"]
)

class LatestSensorResponse(BaseModel):
    created_at: str
    name: str
    value: float

@router.get("/latest")
async def get_latest_sensors(smid: int = None, sensors: str = None):
    """
    Get the latest sensor readings for specified sensors and smid.
    
    Parameters:
    -----------
    smid : int, optional
        The sensor module ID
    sensors : str, optional
        Comma-separated list of sensor names
        
    Returns:
    --------
    List[LatestSensorResponse]
        List of latest sensor readings
    """
    if not sensors:
        raise HTTPException(status_code=400, detail="query parameters sensors are required")
    
    try:
        if not smid:
            sensor_list = sensors.split(",")
            result = query_latest_average_sensors(sensor_list)
        else:
            sensor_list = sensors.split(",")
            result = query_latest_sensors(smid, sensor_list)

        response = result.to_dict('records')[0] if len(result) == 1 else result.to_dict('records')
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/historic")
async def get_historic_sensors(smid: int = None, sensors: str = None, start: str = None, end: str = None, fill: str = 'ffill'):
    """
    Get historic sensor readings for specified sensors and smid.
    
    Parameters:
    -----------
    smid : int
        The sensor module ID
    sensors : str
        Comma-separated list of sensor names
    start : str, optional
        The start date and time of the query
    end : str, optional
        The end date and time of the query  
    fill : str, optional
        The method to fill missing values (ffill, bfill, linear, time)
        
    Returns:
    --------
    List[LatestSensorResponse]
        List of latest sensor readings
    """
    if not smid or not sensors:
        raise HTTPException(status_code=400, detail="query parameters smid and sensors are required")
    
    
    try:
        sensor_list = sensors.split(",")
        result = query_sensors(smid, sensor_list, start, end)
        result = merge_to_largest(*result, fill=fill)
        response = result.to_dict('records')
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))