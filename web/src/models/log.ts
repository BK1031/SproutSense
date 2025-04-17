export interface SystemLog {
  id: bigint;
  message: string;
  created_at: Date;
}

export interface MqttLog {
  id: bigint;
  topic: string;
  message: string;
  created_at: Date;
}
