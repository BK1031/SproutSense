import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BACKEND_URL } from "@/consts/config";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import { useRefreshInterval } from "@/lib/store";
import axios from "axios";
import { Droplets, Thermometer, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function CurrentWeatherCard() {
  const [location, setLocation] = useState("Goleta, CA");
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);

  const refreshInterval = useRefreshInterval();

  useEffect(() => {
    getWeather();
    const interval = setInterval(getWeather, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getWeather = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/query/latest?sensors=temperature,humidity`,
      );
      setTemperature(response.data.temperature);
      setHumidity(response.data.humidity);
    } catch (error: any) {
      toast(getAxiosErrorMessage(error));
    }
  };

  return (
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle className="flex flex-row items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <span className="text-xl font-semibold">
            {location || "Loading..."}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="flex items-center gap-2">
            <Thermometer className="h-6 w-6 text-muted-foreground" />
            <span className="text-4xl font-bold">{temperature}°C</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Droplets className="h-5 w-5" />
            <span className="text-lg">{humidity}% humidity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
