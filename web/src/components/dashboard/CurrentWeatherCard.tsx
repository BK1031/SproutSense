import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Thermometer, MapPin } from "lucide-react";
import { useState } from "react";

export function CurrentWeatherCard() {
  const [location, setLocation] = useState("Goleta, CA");
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);

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
