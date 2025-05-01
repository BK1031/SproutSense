import joblib
import pandas as pd
from datetime import datetime, timedelta
import requests
from pathlib import Path

# Load trained model
MODEL_PATH = Path(__file__).parent / "decision_tree_model.pkl"
model = joblib.load(MODEL_PATH)

# Optional: thresholds from training (or you can recompute/load them)
HIGH_TEMP_THRESHOLD = 35  # adjust as needed
LOW_TEMP_THRESHOLD = 15

def get_weather_forecast(latitude, longitude, api_key):
    base_url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        "lat": latitude,
        "lon": longitude,
        "appid": api_key,
        "units": "metric"
    }

    try:
        response = requests.get(base_url, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            return None
    except:
        return None

def extract_weather_features(forecast_data):
    if not forecast_data or 'list' not in forecast_data:
        return {'avg_forecast_temp': 25, 'precipitation_prob': 0.2}

    now = datetime.now()
    future_until = now + timedelta(days=1)

    forecasts = [
        entry for entry in forecast_data['list']
        if now <= datetime.utcfromtimestamp(entry['dt']) < future_until
    ]

    if not forecasts:
        return {'avg_forecast_temp': 25, 'precipitation_prob': 0.2}

    temps = [entry['main']['temp'] for entry in forecasts]
    avg_temp = sum(temps) / len(temps)

    precipitation_prob = [entry.get('pop', 0) for entry in forecasts]
    avg_precip = sum(precipitation_prob) / len(precipitation_prob)

    return {
        'avg_forecast_temp': round(avg_temp, 2),
        'precipitation_prob': round(avg_precip, 2)
    }

def predict(moisture: float, temp: float, latitude: float, longitude: float, api_key: str):
    print("Inside predict function")
    forecast_data = get_weather_forecast(latitude, longitude, api_key)
    weather = extract_weather_features(forecast_data)

    data_point = pd.DataFrame([[
        moisture,
        temp,
        weather['avg_forecast_temp'],
        weather['precipitation_prob']
    ]], columns=['moisture', 'temp', 'avg_forecast_temp', 'precipitation_prob'])

    pred_class = int(model.predict(data_point)[0])
    recommendations = {
        0: "Not much water needed",
        1: "Normal watering",
        2: "Water heavily"
    }

    return {
        "class": pred_class,
        "recommendation": recommendations[pred_class],
        "features_used": {
            "moisture": moisture,
            "temp": temp,
            "avg_forecast_temp": weather['avg_forecast_temp'],
            "precipitation_prob": weather['precipitation_prob']
        }
    }