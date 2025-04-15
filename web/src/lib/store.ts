import createStore from "react-superstore";
import { BaseStation, initBaseStation } from "@/models/base-station";
import { initSensorModule, SensorModule } from "@/models/sensor-module";

export const [
  useSelectedBaseStation,
  setSelectedBaseStation,
  getSelectedBaseStation,
] = createStore<BaseStation>(initBaseStation());

export const [
  useSelectedSensorModule,
  setSelectedSensorModule,
  getSelectedSensorModule,
] = createStore<SensorModule>(initSensorModule());
