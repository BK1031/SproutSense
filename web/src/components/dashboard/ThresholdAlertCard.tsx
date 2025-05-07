import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";
import { BACKEND_URL } from "@/consts/config";
import rawThresholds from "@/data/plant_thresholds.json";
import { usePlant } from "@/context/plantContext";

const plantThresholds = rawThresholds as Record<
  string,
  Record<string, { min: number; max: number }>
>;

export function ThresholdAlertCard() {
  const [sensorData, setSensorData] = useState<Record<string, number> | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { selectedPlant } = usePlant();

  const fetchSensorData = async () => {
    try {
      setLoading(true); // Start loading
      const res = await axios.get(`${BACKEND_URL}/query/latest`, {
        params: {
          sensors:
            "temperature,humidity,lux,nitrogen,phosphorus,potassium,soil_moisture",
        },
      });

      console.log("Raw sensor API response:", res.data);

      const latestData = { ...res.data };
      delete latestData.created_at;

      setSensorData(latestData);
    } catch (err) {
      console.error("Failed to fetch sensor data:", err);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  useEffect(() => {
    fetchSensorData();

    const interval = setInterval(fetchSensorData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedPlant || !sensorData) return;

    const thresholds = plantThresholds[selectedPlant];
    if (!thresholds) return;

    const outOfRange = Object.entries(thresholds).reduce<string[]>((acc, [key, range]) => {
      const value = sensorData[key];
      if (value === undefined) return acc;
      if (value < range.min || value > range.max) {
        acc.push(`${key} is ${value}, expected between ${range.min} and ${range.max}`);
      }
      return acc;
    }, []);

    setAlerts(outOfRange);
  }, [selectedPlant, sensorData]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {alerts.length > 0 ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          Sensor Alerts ({selectedPlant || "No plant selected"})
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading sensor data...</p>
        ) : (
          <>
            {sensorData && (
              <div className="grid gap-1">
                {Object.entries(plantThresholds[selectedPlant] || {}).map(([key, range]) => {
                  const value = sensorData[key];
                  const isOutOfRange = value < range.min || value > range.max;

                  return (
                    <div
                      key={key}
                      className={`flex justify-between text-sm ${
                        isOutOfRange
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-700 dark:text-green-400"
                      }`}
                    >
                      <span className="capitalize">{key}</span>
                      <span>
                        {value !== undefined
                          ? `${value} (Expected: ${range.min}–${range.max})`
                          : "No data"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {alerts.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Alerts:</p>
                <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                  {alerts.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                All values are within the safe range.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}