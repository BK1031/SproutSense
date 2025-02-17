from flask import Blueprint, jsonify, request
from  .. import db, app
from ..models.sensor_data import SensorData
import struct

BYTE_ARRAY_FORMAT = ">HHHHBBlH"

BYTE_ARRAY_FORMAT_1 = ">HBBHH"

BYTE_ARRAY_FORMAT_2 = ">HBBHHHl"

BYTE_ARRAY_FORMAT_3 = ">HBBHHHlHH"

BYTE_ARRAY_FORMAT_4 = ">HBBHHHlHHlBlB"



BYTE_ARRAY_SIZE = struct.calcsize(BYTE_ARRAY_FORMAT)

BYTE_ARRAY_SIZE_CASE_1 = struct.calcsize(BYTE_ARRAY_FORMAT_1)

BYTE_ARRAY_SIZE_CASE_2 = struct.calcsize(BYTE_ARRAY_FORMAT_2)

BYTE_ARRAY_SIZE_CASE_3 = struct.calcsize(BYTE_ARRAY_FORMAT_3)

BYTE_ARRAY_SIZE_CASE_4 = struct.calcsize(BYTE_ARRAY_FORMAT_4)

ingest_bp = Blueprint('data_ingestion', __name__)

@ingest_bp.route('/ingestCases', methods = ['POST'])
def ingestCases():
    base_station_data = request.data.strip()

    if len(base_station_data) == BYTE_ARRAY_SIZE_CASE_1:
        try:
            unpacked_data = struct.unpack(BYTE_ARRAY_FORMAT_1, base_station_data)
            id, Temp, Humidity, lux_ch0, lux_ch1 = unpacked_data

            return jsonify({
                "message": "Data ingested successfully",
                "data": {
                    "Sensor Module ID": id,
                    "Temp": Temp,
                    "Humidity": Humidity,
                    "Lux_Ch0": lux_ch0,
                    "Lux_Ch1": lux_ch1
                }
            }), 200

        except struct.error as e:
            return jsonify({"error": f"Failed to unpack data: {str(e)}"}), 400
    
    if len(base_station_data) == BYTE_ARRAY_SIZE_CASE_2:
        try:
            unpacked_data = struct.unpack(BYTE_ARRAY_FORMAT_2, base_station_data)
            id, Temp, Humidity, lux_ch0, lux_ch1, nitrogen, soil_moisture = unpacked_data

            return jsonify({
                "message": "Data ingested successfully",
                "data": {
                    "Sensor Module ID": id,
                    "Temp": Temp,
                    "Humidity": Humidity,
                    "Lux_Ch0": lux_ch0,
                    "Lux_Ch1": lux_ch1,
                    "nitrogen": nitrogen,
                    "soil moisture": soil_moisture
                }
            }), 200

        except struct.error as e:
            return jsonify({"error": f"Failed to unpack data case 2: {str(e)}"}), 400
    
    if len(base_station_data) == BYTE_ARRAY_SIZE_CASE_3:
        try:
            unpacked_data = struct.unpack(BYTE_ARRAY_FORMAT_3, base_station_data)
            id, Temp, Humidity, lux_ch0, lux_ch1, nitrogen, soil_moisture,phosphorus, potassium= unpacked_data

            return jsonify({
                "message": "Data ingested successfully",
                "data": {
                    "Sensor Module ID": id,
                    "Temp": Temp,
                    "Humidity": Humidity,
                    "Lux_Ch0": lux_ch0,
                    "Lux_Ch1": lux_ch1,
                    "nitrogen": nitrogen,
                    "soil moisture": soil_moisture,
                    "phosphorus": phosphorus,
                    "potassium" : potassium
                }
            }), 200

        except struct.error as e:
            return jsonify({"error": f"Failed to unpack data case 3: {str(e)}"}), 400
    
    if len(base_station_data) == BYTE_ARRAY_SIZE_CASE_4:
        print("we are in case 4")
        try:
            unpacked_data = struct.unpack(BYTE_ARRAY_FORMAT_4, base_station_data)
            id, Temp, Humidity, lux_ch0, lux_ch1, nitrogen, soil_moisture,phosphorus, potassium, latitude, north_or_south, longitude, east_or_west= unpacked_data

            return jsonify({
                "message": "Data ingested successfully",
                "data": {
                    "Sensor Module ID": id,
                    "Temp": Temp,
                    "Humidity": Humidity,
                    "Lux_Ch0": lux_ch0,
                    "Lux_Ch1": lux_ch1,
                    "nitrogen": nitrogen,
                    "soil moisture": soil_moisture,
                    "phosphorus": phosphorus,
                    "potassium" : potassium,
                    "latidue": latitude,
                    "north or south": north_or_south,
                    "longitude": longitude,
                    "east or west": east_or_west
                }
            }), 200

        except struct.error as e:
            return jsonify({"error": f"Failed to unpack data case 3: {str(e)}"}), 400
    return jsonify({"error": "Invalid data size"}), 400


@ingest_bp.route('/ingest', methods = ['POST'])
def ingest():
    base_station_data = request.data.strip()

    if len(base_station_data) != BYTE_ARRAY_SIZE:
        return jsonify({"error": "Invalid data size"}), 400
    
    try:
        unpacked_data = struct.unpack(BYTE_ARRAY_FORMAT, base_station_data)
        id, N, P, K, Temp, Humidity, SoilMoisture, UV = unpacked_data
        print(f"this is at test for id {id}")
        new_sensor_data = SensorData(nitrogen=N, phosphorus=P, potassium=K,
                                    humidity=Humidity, soilmoisture=SoilMoisture, temperature=Temp, uv=UV,sensormoduleid = id)
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
