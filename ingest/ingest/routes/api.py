from flask import Blueprint, jsonify
from ingest.service import sensor
from ingest.models.sensor_module import SensorModule  # make sure this import is correct
from ingest.models.base_station import BaseStation
from ingest.models.sensor import Sensor
from ingest.database.db import get_db


api_bp = Blueprint('api', __name__)

@api_bp.route('/api/data_by_ID/<int:sensor_id>', methods=['GET'])
def data_by_id(sensor_id):
    sensor_data = sensor.get_sensor_data_by_id(sensor_id)
    if not sensor_data:
        return jsonify({"error": "Sensor not found"}), 404
    return jsonify(sensor_data.to_dict())

@api_bp.route('/api/data_by_smid_and_millis/<int:smid>/<int:millis>', methods=['GET'])
def data_by_smid_and_millis(smid, millis):
    sensor_data = sensor.get_sensor_data_by_smid_and_millis(smid, millis)
    if not sensor_data:
        return jsonify({"error": "Sensor not found"}), 404
    return jsonify(sensor_data.to_dict())

@api_bp.route('/api/data_by_bsid_and_smid/<int:bsid>/<int:smid>', methods=['GET'])
def data_by_bsid_and_smid(bsid, smid):
    sensor_data_list = sensor.get_sensor_data_by_bsid_and_smid(bsid, smid)
    return jsonify([s.to_dict() for s in sensor_data_list])

@api_bp.route('/api/data_by_bsid/<int:bsid>', methods=['GET'])
def data_by_bsid(bsid):
    sensor_data_list = sensor.get_sensor_data_by_bsid(bsid)
    return jsonify([s.to_dict() for s in sensor_data_list])

@api_bp.route('/api/data_by_smid/<int:smid>', methods=['GET'])
def data_by_smid(smid):
    sensor_data_list = sensor.get_sensor_data_by_smid(smid)
    return jsonify([s.to_dict() for s in sensor_data_list])

@api_bp.route('/api/all_data', methods=['GET'])
def all_data():
    sensor_data_list = sensor.get_all_sensor_data()
    return jsonify([s.to_dict() for s in sensor_data_list])

from ingest.models.sensor_module import SensorModule  # make sure this import is correct

@api_bp.route("/api/sensor_modules", methods=["GET"])
def get_sensor_modules():
    session = get_db()
    modules = session.query(SensorModule).all()
    return jsonify([
        {
            "id": m.id,
            "name": m.name,
            "latitude": m.latitude,
            "longitude": m.longitude,
            "last_ping": m.last_ping.isoformat(),
            "created_at": m.created_at.isoformat()
        }
        for m in modules
    ])

@api_bp.route("/api/base_stations", methods=["GET"])
def get_base_stations():
    session = get_db()
    stations = session.query(BaseStation).all()
    return jsonify([
        {
            "id": b.id,
            "name": b.name,
            "latitude": b.latitude,
            "longitude": b.longitude,
            "last_ping": b.last_ping.isoformat(),
            "created_at": b.created_at.isoformat()
        }
        for b in stations
    ])