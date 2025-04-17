import { Thermometer, Droplets, Sun, Leaf, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SensorModule } from "@/models/sensor-module";
import { formatDistanceToNow } from "date-fns";
import { BACKEND_URL } from "@/consts/config";
import { toast } from "sonner";
import axios from "axios";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import { useEffect, useState } from "react";

const SensorModuleCard = ({ module }: { module: SensorModule }) => {
  const [sensorData, setSensorData] = useState<{
    temperature: number;
    humidity: number;
    soil_moisture: number;
    lux: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  }>({
    temperature: 0,
    humidity: 0,
    soil_moisture: 0,
    lux: 0,
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
  });

  const getOnlineStatus = () => {
    const lastPingTime = new Date(module.last_ping).getTime();
    const currentTime = new Date().getTime();
    const hourInMilliseconds = 60 * 60 * 1000;
    return currentTime - lastPingTime <= hourInMilliseconds;
  };

  const getCurrentSensorData = () => {
    try {
      axios
        .get(
          `${BACKEND_URL}/query/latest?smid=${module.id}&sensors=temperature,humidity,soil_moisture,lux,nitrogen,phosphorus,potassium`,
        )
        .then((response) => {
          setSensorData(response.data);
        });
    } catch (error: any) {
      toast(getAxiosErrorMessage(error));
    }
  };

  useEffect(() => {
    getCurrentSensorData();
  }, []);

  return (
    <div className="w-[300px] overflow-hidden">
      <div className="rounded-t-md border-b bg-neutral-50 p-4 dark:bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf
              className={`h-5 w-5 ${getOnlineStatus() ? "text-green-500" : "text-neutral-400"}`}
            />
            <h3 className="font-semibold">{module.name}</h3>
          </div>
          <span
            className={`rounded-full px-2 py-1 text-xs ${getOnlineStatus() ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-700"}`}
          >
            {getOnlineStatus() ? "Online" : "Offline"}
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-500">ID: {module.id}</p>
      </div>
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Environmental Data
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Card className="flex items-center gap-2 p-2">
              <Thermometer className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-neutral-500">Temperature</p>
                <p className="font-medium">
                  {sensorData.temperature.toFixed(2)}°C
                </p>
              </div>
            </Card>
            <Card className="flex items-center gap-2 p-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-neutral-500">Humidity</p>
                <p className="font-medium">{sensorData.humidity.toFixed(2)}%</p>
              </div>
            </Card>
            <Card className="flex items-center gap-2 p-2">
              <Sun className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-neutral-500">Light</p>
                <p className="font-medium">{sensorData.lux.toFixed(2)} lux</p>
              </div>
            </Card>
            <Card className="flex items-center gap-2 p-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-neutral-500">Soil Moisture</p>
                <p className="font-medium">
                  {sensorData.soil_moisture.toFixed(2)}%
                </p>
              </div>
            </Card>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Nutrient Levels
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <Card className="flex flex-col items-center p-2">
              <p className="text-xs text-neutral-500">N</p>
              <p className="font-medium">{sensorData.nitrogen.toFixed(2)}</p>
            </Card>
            <Card className="flex flex-col items-center p-2">
              <p className="text-xs text-neutral-500">P</p>
              <p className="font-medium">{sensorData.phosphorus.toFixed(2)}</p>
            </Card>
            <Card className="flex flex-col items-center p-2">
              <p className="text-xs text-neutral-500">K</p>
              <p className="font-medium">{sensorData.potassium.toFixed(2)}</p>
            </Card>
          </div>
        </div>
      </div>
      <div className="rounded-b-md border-t bg-neutral-50 p-3 dark:bg-black">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Clock className="h-3 w-3" />
          <span>
            Last updated{" "}
            {formatDistanceToNow(new Date(module.last_ping), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SensorModuleCard;
