from flask import Blueprint, jsonify, request
from  .. import db, app
from ..models.sensor_data import SensorData
import struct

BYTE_ARRAY_CASES = {
    'case_1':{
        'format': ">HBBHH",
        'sensor_data': ['module_id', 'temperature', 'humidity', 'lux_ch0', 'lux_ch1'],
        'size': struct.calcsize(">HBBHH")
    },
    'case_2':{
        'format': ">HBBHHHl",
        'sensor_data': ['module_id', 'temperature', 'humidity', 'lux_ch0', 'lux_ch1',
                         'nitrogen', 'soil_moisture'],
        'size': struct.calcsize(">HBBHHHl")
    },
    'case_3':{
        'format': ">HBBHHHlHH",
        'sensor_data': ['module_id', 'temperature', 'humidity', 'lux_ch0', 'lux_ch1',
                         'nitrogen', 'soil_moisture', 'phosphorus', 'potassium'],
        'size': struct.calcsize(">HBBHHHlHH")
    },
    'case_4':{
        'format': ">HBBHHHlHHlBlB",
        'sensor_data': ['module_id', 'temperature', 'humidity', 'lux_ch0', 'lux_ch1',
                         'nitrogen', 'soil_moisture', 'phosphorus', 'potassium', 'latitude',
                         'north_or_south', 'longitude', 'east_or_west'],
        'size': struct.calcsize(">HBBHHHlHHlBlB")
    },
    
}

def process_payload(sensor_data):

    payload_size = len(sensor_data)

    payload_case_name = next(
        (name for name, case in BYTE_ARRAY_CASES.items() if case['size'] == payload_size),
        None
    )

    if not payload_case_name:
        return {"eror": "Not a valid payload size"}, 400
    
    try:
        payload_case = BYTE_ARRAY_CASES[payload_case_name]
        upacked_data = struct.unpack(payload_case['format'], sensor_data)

        # create an object for the data ingested and add to db
        # db.session.add(ingested_data)
        # db.session.commit()

        processed_data = dict(zip(payload_case['sensor_data'], upacked_data))

        return {
            "message": "Sensor Data Processed Successfully",
            "data": processed_data
        }, 200

    except struct.error as e:
        return {"error": f"Failed to unpack data: {str(e)}"}, 400


ingest_bp = Blueprint('data_ingestion', __name__)

@ingest_bp.route('/ingest', methods = ['POST'])
def ingestCases():
    sensor_data = request.data.strip()
    response, status_code = process_payload(sensor_data)

    return jsonify(response), status_code

