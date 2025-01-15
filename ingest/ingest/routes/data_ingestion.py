from flask import Blueprint, jsonify, request
from  .. import db
from ..models.sensor_data import SensorData
import struct

BYTE_ARRAY_FORMAT = ">HHHBBlH"

BYTE_ARRAY_SIZE = struct.calcsize(BYTE_ARRAY_FORMAT)

ingest_bp = Blueprint('data_ingestion', __name__)


@ingest_bp.route('/ingest', methods = ['POST'])
def ingest():
    base_station_data = request.data.strip()

    if len(base_station_data) != BYTE_ARRAY_SIZE:
        return jsonify({"error": "Invalid data size"}), 400
    
    try:
        unpacked_data = struct.unpack(BYTE_ARRAY_FORMAT, base_station_data)
        N, P, K, Temp, Humidity, SoilMoisture, UV = unpacked_data
        print(f"N: {N}, P: {P}, K: {K}, Temp: {Temp}, Humidity: {Humidity}, Soil Moisture: {SoilMoisture}, UV: {UV}")
        print(type(SoilMoisture)) 
        new_sensor_data = SensorData(nitrogen=N, phosphorus=P, potassium=K,
                                    humidity=Humidity, soilmoisture=SoilMoisture, uv=UV)
        db.session.add(new_sensor_data)
        db.session.commit()

        return jsonify({
            "message": "Data ingested successfully",
            "data": {
                "N": N,
                "P": P,
                "K": K,
                "Temp": Temp,
                "Humidity": Humidity,
                "SoilMoisture": SoilMoisture,
                "UV": UV
            }
        }), 200

    except struct.error as e:
        return jsonify({"error": f"Failed to unpack data: {str(e)}"}), 400