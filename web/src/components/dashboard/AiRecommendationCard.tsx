import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BACKEND_URL, OPENWEATHER_API_KEY } from "@/consts/config";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Droplets, Thermometer, Bot } from "lucide-react";

export function AIRecommendationCard() {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avgMoisture, setAvgMoisture] = useState<number | null>(null);
  const [avgTemperature, setAvgTemperature] = useState<number | null>(null);
  const [displayDate, setDisplayDate] = useState<string | null>(null);

  const fetchPrediction = async () => {
    let avgMoisture = null;
    let avgTemperature = null;
    try {
      //these lines are used to get the date of yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yDate = yesterday.toISOString().split("T")[0]; //"2025-04-30"

      const parts = yDate.split("-");
      const formatted = `${parts[1]}-${parts[2]}-${parts[0]}`; // MM-DD-YYYY
      setDisplayDate(formatted);

      // Fetch averages from /ai/avg
      const avgResponse = await axios.get(`${BACKEND_URL}/ai/avg`, {
        params: { day: yDate },
      });
      avgMoisture = avgResponse.data.avg_moisture;
      avgTemperature = avgResponse.data.avg_temp;
      setAvgMoisture(avgMoisture);
      setAvgTemperature(avgTemperature);
    } catch (error) {
      console.error(
        "Failed to fetch averages from /ai/avg:",
        getAxiosErrorMessage(error),
      );
      setRecommendation("Error: Failed to fetch sensor averages.");
      setLoading(false);
      return; // exit early to avoid making prediction request with bad data
    }

    setLoading(true);
    try {
      // 1. Fetch base station info (assuming ID = 2)
      const baseRes = await axios.get(`${BACKEND_URL}/base-station/2`);
      const { latitude, longitude } = baseRes.data;

      const response = await axios.post(`${BACKEND_URL}/ai/predict`, {
        moisture: avgMoisture,
        temp: avgTemperature,
        latitude: latitude,
        longitude: longitude,
        api_key: OPENWEATHER_API_KEY,
      });

      setRecommendation(response.data.recommendation);
    } catch (error) {
      setRecommendation("Error: " + getAxiosErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[200px] w-full p-2">
      <CardHeader className="flex flex-row items-center justify-between px-2 pb-1">
        <CardTitle className="flex flex-row items-center gap-1 text-lg">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">AI Recommendation</span>
        </CardTitle>
        <Button
          onClick={fetchPrediction}
          variant="ghost"
          size="sm"
          className="h-5 px-2 py-0 text-xs text-muted-foreground hover:text-foreground"
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="grid gap-1 px-2 pt-0">
        {loading ? (
          <span className="text-sm font-medium">Loading...</span>
        ) : recommendation ? (
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            {recommendation}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            No prediction yet
          </span>
        )}
        {avgMoisture !== null && avgTemperature !== null && (
          <div className="grid gap-2">
            {/* Moisture Block */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">Moisture</span>
                  <p className="text-[12px] text-muted-foreground">
                    Avg {displayDate}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-neutral-800 dark:text-white">
                {avgMoisture.toFixed(2)}
              </span>
            </div>

            {/* Temperature Block */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">Temp</span>
                  <p className="text-[12px] text-muted-foreground">
                    Avg {displayDate}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-neutral-800 dark:text-white">
                {avgTemperature.toFixed(2)}°C
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
