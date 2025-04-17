import datetime
from ingest.models.log import SystemLog, MqttLog
from ingest.database.db import get_db

def save_system_log(message: str) -> SystemLog:
    """Save a message to the system log"""
    db = get_db()
    system_log = SystemLog()
    system_log.message = message
    system_log.created_at = datetime.datetime.now()
    db.add(system_log)
    db.commit()
    return system_log

def save_mqtt_message(topic: str, message: str) -> MqttLog:
    """Save a message to the MQTT log"""
    db = get_db()
    mqtt_log = MqttLog()
    mqtt_log.topic = topic
    mqtt_log.message = message
    mqtt_log.created_at = datetime.datetime.now()
    db.add(mqtt_log)
    db.commit()
    return mqtt_log