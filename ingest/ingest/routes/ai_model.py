from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
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