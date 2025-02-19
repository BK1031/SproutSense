from flask import Blueprint, jsonify, request
from  .. import db, app
from ..models.sensor_data import SensorData
from ..models.base_station import BaseStation
from ..models.sensor_module import SensorModule
import struct

BYTE_ARRAY_CASES = {
    'case_1':{
        # i need to change the format since we are now also transmitting the case_id with it
        'format': ">HHBBBHH",
        'sensor_data': ['base_station_id', 'module_id', 'case_id', 'temperature', 'humidity', 'lux_ch0', 'lux_ch1'],
        'size': struct.calcsize(">HHBBBHH")
    },
    'case_2':{
        'format': ">HHBBBHHHl",
        'sensor_data': ['base_station_id', 'module_id', 'case_id', 'temperature', 'humidity', 'lux_ch0', 'lux_ch1',
                         'nitrogen', 'soil_moisture'],
        'size': struct.calcsize(">HHBBBHHHl")
    },
    'case_3':{
        'format': ">HHBBBHHHlHH",
        'sensor_data': ['base_station_id', 'module_id', 'case_id', 'temperature', 'humidity', 'lux_ch0', 'lux_ch1',
                         'nitrogen', 'soil_moisture', 'phosphorus', 'potassium'],
        'size': struct.calcsize(">HHBBBHHHlHH")
    },
    'case_4':{
        'format': ">HHBBBHHHlHHlBlB",
        'sensor_data': ['base_station_id', 'module_id', 'case_id', 'temperature', 'humidity', 'lux_ch0', 'lux_ch1',
                         'nitrogen', 'soil_moisture', 'phosphorus', 'potassium', 'latitude',
                         'north_or_south', 'longitude', 'east_or_west'],
        'size': struct.calcsize(">HHBBBHHHlHHlBlB")
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

        # return {
        #     "data": processed_data
        # }, 200

        return processed_data, 200

    except struct.error as e:
        return {"error": f"Failed to unpack data: {str(e)}"}, 400


ingest_bp = Blueprint('data_ingestion', __name__)

@ingest_bp.route('/ingest', methods = ['POST'])
def ingestCases():
    sensor_data = request.data.strip()
    response, status_code = process_payload(sensor_data)

    base_station_id = response["base_station_id"]
    sensor_module_id = response["module_id"]

    base_station = BaseStation.query.get(base_station_id)
    sensor_module = SensorModule.query.get(sensor_module_id)    

    if base_station and sensor_module:
        # add the columns for all the fields
        x = 1
    elif base_station and not sensor_module:
        # create sensor module and add to db
        sensor_module_name = "module 1"
        new_sensor_module = SensorModule(id=sensor_module_id, name=sensor_module_name, latitude = 1000, longitude = 1000)
        db.session.add(new_sensor_module)
        db.session.commit()
    elif not base_station and sensor_module:
        # add base station to table
        x = 1
    else:
        print("we enter this case because we have nothing on the db")
        sensor_module_name = "module 1"
        base_station_name = "base station 1"
        new_sensor_module = SensorModule(id=sensor_module_id, name=sensor_module_name, latitude = 1000, longitude = 1000)
        new_base_station = BaseStation(id=base_station_id, name=base_station_name, latitude = 1000, longitude = 1000)
        db.session.add(new_sensor_module)
        db.session.add(new_base_station)
        db.session.commit()


    print(f"b id: {base_station_id}, s_id: {sensor_module_id}")

    return jsonify(response), status_code

