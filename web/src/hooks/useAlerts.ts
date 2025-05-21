import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/consts/config";
import rawThresholds from "@/data/plant_thresholds.json";
import { usePlant } from "@/context/plantContext";

const plantThresholds = rawThresholds as Record<
  string,
  Record<string, { min: number; max: number }>
>;

const SNOOZE_KEY = "sensor_alerts_snoozed_until";

function getSnoozedUntil(): Record<number, string> {
  const raw = localStorage.getItem(SNOOZE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function isSnoozed(smid: number): boolean {
  const snoozedUntil = getSnoozedUntil();
  const until = snoozedUntil[smid];
  if (!until) return false;
  return new Date(until) > new Date();
}

function snoozeModule(smid: number, durationMinutes: number) {
  const snoozedUntil = getSnoozedUntil();
  const until = new Date(Date.now() + durationMinutes * 60 * 1000);
  snoozedUntil[smid] = until.toISOString();
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozedUntil));
}

function isDangerouslyOutOfRange(
  value: number,
  min: number,
  max: number,
): boolean {
  const margin = (max - min) * 0.5;
  return value < min - margin || value > max + margin;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<string[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<string[]>([]);
  const [allAlerts, setAllAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { selectedPlant } = usePlant();

  const fetchSensorData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/query/latest-per-module`, {
        params: {
          sensors:
            "temperature,humidity,lux,nitrogen,phosphorus,potassium,soil_moisture",
        },
      });

      const data: Record<string, any>[] = res.data;
      const plantName = selectedPlant || Object.keys(plantThresholds)[0];
      const thresholds = plantThresholds[plantName];
      if (!thresholds) return;

      const visibleAlerts: string[] = [];
      const critical: string[] = [];
      const all: string[] = [];

      for (const row of data) {
        const smid = row.smid;
        for (const sensorName of Object.keys(thresholds)) {
          const value = row[sensorName];
          if (value === undefined) continue;

          const range = thresholds[sensorName];
          const isOut = value < range.min || value > range.max;
          const isCritical = isDangerouslyOutOfRange(
            value,
            range.min,
            range.max,
          );
          const msg = `SM ${smid} - ${sensorName} is ${value} (Expected: ${range.min}–${range.max})`;

          if (isOut || isCritical) all.push(msg); // all alerts (for cards)

          if (isCritical) {
            critical.push(msg); // always show critical
          } else if (isOut && !isSnoozed(smid)) {
            visibleAlerts.push(msg); // dismissible and not snoozed
          }
        }
      }

      setAlerts(visibleAlerts);
      setCriticalAlerts(critical);
      setAllAlerts(all);
    } catch (err) {
      console.error("Alert fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPlant]);

  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);

  const dismissAlerts = (
    smid: number,
    durationMinutes?: number,
    until?: Date,
  ) => {
    const snoozedUntil = getSnoozedUntil();
    const targetDate =
      until ?? new Date(Date.now() + (durationMinutes ?? 60) * 60 * 1000);
    snoozedUntil[smid] = targetDate.toISOString();
    localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozedUntil));
    setAlerts((prev) => prev.filter((a) => !a.includes(`SM ${smid} `)));
  };

  return {
    alerts,
    criticalAlerts,
    allAlerts, // ← for use in cards
    loading,
    dismissAlerts,
    fetchSensorData,
  };
}
