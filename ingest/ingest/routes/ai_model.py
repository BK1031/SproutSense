from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from datetime import date, datetime, timedelta
from ingest.service.sensor import get_average_sensor_value_for_day
import ingest.ai.watering_prediction as watering_prediction

router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)

class PredictionRequest(BaseModel):
    moisture: float
    temp: float
    latitude: float
    longitude: float
    api_key: str

@router.post("/predict")
async def predict_irrigation(request: PredictionRequest):
    try:
        result = watering_prediction.predict(
            moisture=request.moisture,
            temp=request.temp,
            latitude=request.latitude,
            longitude=request.longitude,
            api_key=request.api_key,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/avg")
async def get_average_prediction(day: date = Query(..., description="UTC date in ISO format (e.g., 2025-04-28)")):
    start_of_day = datetime.combine(day, datetime.min.time())
    avg_moisture = get_average_sensor_value_for_day("soil_moisture", start_of_day)
    avg_temp = get_average_sensor_value_for_day("temperature", start_of_day)

    return {
        "avg_moisture": avg_moisture,
        "avg_temp": avg_temp,
    }