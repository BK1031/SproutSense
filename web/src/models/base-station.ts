export interface BaseStation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  last_ping: Date;
  created_at: Date;
}

export const initBaseStation = (): BaseStation => ({
  id: 0,
  name: "",
  latitude: 0,
  longitude: 0,
  last_ping: new Date(),
  created_at: new Date(),
});
