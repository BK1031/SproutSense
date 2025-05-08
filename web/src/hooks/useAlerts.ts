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
      const res = await axios.get(`${BACKEND_URL}/query/latest`, {
        params: {
          sensors:
            "temperature,humidity,lux,nitrogen,phosphorus,potassium,soil_moisture",
        },
      });

      const latestData = { ...res.data };
      delete latestData.created_at;

      const thresholds = plantThresholds[selectedPlant];
      if (!thresholds) return;

      const outOfRange = Object.entries(thresholds).reduce<string[]>((acc, [key, range]) => {
        const value = latestData[key];
        if (value === undefined) return acc;
        if (value < range.min || value > range.max) {
          acc.push(`${key} is ${value}, expected between ${range.min} and ${range.max}`);
        }
        return acc;
      }, []);

      if (!isDismissedToday()) {
        setAlerts(outOfRange);
      } else {
        setAlerts([]);
      }
      console.log("dismissed?", isDismissedToday());
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