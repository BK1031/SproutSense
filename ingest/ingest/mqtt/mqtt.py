import random
import paho.mqtt.client as mqtt
from ingest.config.config import MQTT_HOST, MQTT_PORT
from ingest.mqtt.handler import handle_base_station_bps, handle_base_station_debug, handle_message

def init_mqtt():
    client_id = generate_client_id()
    mqtt_client = MQTTClient(client_id=client_id)
    mqtt_client.connect()
    mqtt_client.subscribe("ingest/+", handle_message)
    mqtt_client.subscribe("ingest/+/bps", handle_base_station_bps)
    mqtt_client.subscribe("ingest/+/debug", handle_base_station_debug)

def generate_client_id():
    return f"ingest-{random.randint(100000, 999999)}"

class MQTTClient:
    def __init__(self, broker_host=MQTT_HOST, broker_port=int(MQTT_PORT), client_id=None):
        if not broker_host:
            raise ValueError("MQTT_HOST is not set")
        elif not broker_port:
            raise ValueError("MQTT_PORT is not set")
        elif not client_id:
            raise ValueError("Client ID is not set")
        else:
            self.broker_host = broker_host
            self.broker_port = broker_port
            self.client = mqtt.Client(client_id=client_id)
            self.topic_handlers = {}

        # Set up callbacks
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message

    def connect(self):
        """Establish connection to the MQTT broker"""
        try:
            self.client.connect(self.broker_host, self.broker_port)
            self.client.loop_start()
            print(f"Connected to MQTT broker at {self.broker_host}:{self.broker_port}")
        except Exception as e:
            print(f"Failed to connect to MQTT broker: {e}")
            raise

    def disconnect(self):
        """Disconnect from the MQTT broker"""
        self.client.loop_stop()
        self.client.disconnect()
        print("Disconnected from MQTT broker")

    def subscribe(self, topic, callback):
        """
        Subscribe to a topic and register a callback handler
        
        Args:
            topic (str): The MQTT topic to subscribe to
            callback (callable): Function to be called when a message is received
        """
        self.topic_handlers[topic] = callback
        self.client.subscribe(topic)
        print(f"Subscribed to topic: {topic}")

    def publish(self, topic, payload, qos=0, retain=False):
        """
        Publish a message to a topic
        """
        self.client.publish(topic, payload, qos=qos, retain=retain)
        print(f"Published message to topic {topic}")

    def _on_message(self, client, userdata, message):
        """Callback for when a message is received"""
        topic = message.topic
        # Check each registered topic pattern for a match
        for registered_topic, handler in self.topic_handlers.items():
            if mqtt.topic_matches_sub(registered_topic, topic):
                handler(topic, message.payload)
                break

    def _on_connect(self, client, userdata, flags, rc):
        """Callback for when the client connects to the broker"""
        if rc == 0:
            print("Successfully connected to MQTT broker")
            # Resubscribe to all topics
            topics = list(self.topic_handlers.keys())
            for topic in topics:
                self.client.subscribe(topic)
        else:
            print(f"Failed to connect to MQTT broker with code: {rc}")

    def _on_disconnect(self, client, userdata, rc):
        """Callback for when the client disconnects from the broker"""
        if rc != 0:
            print("Unexpected disconnection from MQTT broker")
