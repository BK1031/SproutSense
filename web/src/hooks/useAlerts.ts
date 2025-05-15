import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/consts/config";
import rawThresholds from "@/data/plant_thresholds.json";
import { usePlant } from "@/context/plantContext";

const plantThresholds = rawThresholds as Record<
  string,
  Record<string, { min: number; max: number }>
>;

const DISMISS_KEY = "sensor_alerts_dismissed_at";

function isDismissedToday(): boolean {
  const stored = localStorage.getItem(DISMISS_KEY);
  if (!stored) return false;

  const lastDismissed = new Date(stored);
  const now = new Date();

  return (
    lastDismissed.getDate() === now.getDate() &&
    lastDismissed.getMonth() === now.getMonth() &&
    lastDismissed.getFullYear() === now.getFullYear()
  );
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { selectedPlant } = usePlant();

  const fetchSensorData = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching sensor data...");
      const res = await axios.get(`${BACKEND_URL}/query/latest-per-module`, {
        params: {
          sensors:
            "temperature,humidity,lux,nitrogen,phosphorus,potassium,soil_moisture",
        },
      });

      const data: {
        smid: number;
        name: string;
        value: number;
        created_at: string;
      }[] = res.data;

      console.log("Raw sensor API response:", data);

      const fallbackPlant = Object.keys(plantThresholds)[0];
      const plantName = selectedPlant || fallbackPlant;
      const thresholds = plantThresholds[plantName];
      if (!thresholds) {
        console.warn("No thresholds found for plant:", plantName);
        return;
      }

      const outOfRange: string[] = [];

      for (const row of data) {
        const smid = row.smid;
      
        for (const sensorName of Object.keys(thresholds)) {
          const value = row[sensorName];
          const range = thresholds[sensorName];
      
          if (value === undefined) {
            console.log(`⚠️ No value for sensor "${sensorName}" in row`, row);
            continue;
          }
      
          console.log(`SM ${smid} - ${sensorName}: ${value}`);
      
          if (value < range.min || value > range.max) {
            console.log(`→ OUT OF RANGE! Expected ${range.min}–${range.max}, got ${value}`);
            outOfRange.push(
              `SM ${smid} - ${sensorName} is ${value} (Expected: ${range.min}–${range.max})`
            );
          }
        }
      }

      console.log("Dismissed today?", isDismissedToday());
      console.log("Final out-of-range alerts:", outOfRange);

      if (!isDismissedToday()) {
        setAlerts(outOfRange);
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error("Alert fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPlant]);

  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);

  const dismissAlerts = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setAlerts([]);
  };

  return { alerts, loading, dismissAlerts, fetchSensorData };
}