from fastapi import APIRouter, HTTPException, Request
from typing import List
import numpy as np
from pydantic import BaseModel
from ingest.service.query import merge_to_largest, query_latest_average_sensors, query_sensors, query_latest_sensors
from ingest.service.sensor_module import get_all_sensor_modules
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

        df_dict = result.copy()
        df_dict['created_at'] = df_dict['created_at'].dt.tz_localize('UTC').dt.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        
        # Replace inf/-inf and NaN values with None
        df_dict = df_dict.replace([np.inf, -np.inf], None)
        df_dict = df_dict.replace({np.nan: None})
        
        response = df_dict.to_dict('records')[0] if len(df_dict) == 1 else df_dict.to_dict('records')
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
        # Convert timestamps to ISO format strings and handle special float values
        df_dict = result.copy()
        df_dict['created_at'] = df_dict['created_at'].dt.tz_localize('UTC').dt.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        
        # Replace inf/-inf and NaN values with None
        df_dict = df_dict.replace([np.inf, -np.inf], None)
        df_dict = df_dict.replace({np.nan: None})
        response = df_dict.to_dict(orient='records')
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/latest-timestamp")
async def get_latest_timestamp(sensors: str):
    """
    Returns the timestamp of the most recent sensor reading (UTC ISO string).
    Used for checking if new data is available.
    """
    if not sensors:
        raise HTTPException(status_code=400, detail="query parameter 'sensors' is required")
    
    try:
        sensor_list = sensors.split(",")
        result = query_latest_average_sensors(sensor_list)

        if result.empty:
            raise HTTPException(status_code=404, detail="No sensor data found")

        latest_timestamp = result["created_at"].max()
        return {"latest_timestamp": latest_timestamp.tz_localize('UTC').isoformat()}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/latest-per-module")
async def get_latest_per_module(sensors: str = None):
    if not sensors:
        raise HTTPException(status_code=400, detail="Query parameter 'sensors' is required")

    try:
        sensor_list = sensors.split(",")
        smids = [m.id for m in get_all_sensor_modules()]

        results = []

        for smid in smids:
            df = query_latest_sensors(smid, sensor_list)
            if not df.empty:
                df["smid"] = smid # Add smid to the DataFrame
                results.extend(df.to_dict(orient="records"))

        return results

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
