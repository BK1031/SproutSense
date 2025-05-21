import {
  Thermometer,
  Droplets,
  Sun,
  Leaf,
  Clock,
  AlertTriangle,
  LocateFixed,
  LocateOff,
  SearchCode,
  AreaChart,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SensorModule } from "@/models/sensor-module";
import { formatDistanceToNow } from "date-fns";
import { BACKEND_URL } from "@/consts/config";
import { toast } from "sonner";
import axios from "axios";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import { useEffect, useState } from "react";
import { useRefreshInterval } from "@/lib/store";
import { useAlerts } from "@/hooks/useAlerts";

interface SensorModuleCardProps {
  module: SensorModule;
  setNavigationURL: React.Dispatch<React.SetStateAction<string | null>>;
}
const SensorModuleCard = ({
  module,
  setNavigationURL,
}: SensorModuleCardProps) => {
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    soil_moisture: 0,
    lux: 0,
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
  });
  const refreshInterval = useRefreshInterval();
  const { alerts, criticalAlerts, allAlerts } = useAlerts();
  const moduleAlerts = alerts.filter((msg) => msg.includes(`SM ${module.id} `));
  const moduleCriticalAlerts = criticalAlerts.filter((msg) =>
    msg.includes(`SM ${module.id} `),
  );
  const moduleAllAlerts =
    allAlerts?.filter((msg) => msg.includes(`SM ${module.id} `)) || [];
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const getOnlineStatus = () => {
    const lastPingTime = new Date(module.last_ping + "Z").getTime();
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
    const interval = setInterval(getCurrentSensorData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return (
    <div className="scrollbar-hide max-h-[90vh] overflow-y-auto">
      <div className="rounded-t-md border-b bg-neutral-50 p-4 dark:bg-black">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Leaf
                className={`h-5 w-5 ${getOnlineStatus() ? "text-green-500" : "text-neutral-400"}`}
              />
              <h3 className="font-semibold">{module.name}</h3>
            </div>
            <p className="mt-1 text-sm text-neutral-500">ID: {module.id}</p>
          </div>
          <div className="flex flex-col items-end justify-start gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs ${getOnlineStatus() ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-700"}`}
            >
              {getOnlineStatus() ? "Online" : "Offline"}
            </span>
            <div className="flex flex-1 flex-col flex-wrap items-end justify-start gap-2">
              {module.latitude != 0 && module.longitude != 0 ? (
                <Card
                  className={`w-min border-none px-[6px] py-[3px] text-center ${getOnlineStatus() ? "bg-green-500 dark:bg-green-500/60" : "bg-neutral-400 dark:bg-neutral-400/60"}`}
                >
                  <div className="flex items-center gap-1">
                    <LocateFixed className="h-4 w-4 text-white" />
                  </div>
                </Card>
              ) : (
                <Card
                  className={`w-min border-none px-[6px] py-[3px] text-center ${getOnlineStatus() ? "bg-yellow-500 dark:bg-yellow-500/60" : "bg-neutral-400 dark:bg-neutral-400/60"}`}
                >
                  <div className="flex items-center gap-1">
                    <LocateOff className="h-4 w-4 text-white" />
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
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
        {(moduleCriticalAlerts.length > 0 || moduleAlerts.length > 0) && (
          <div className="space-y-2 border-t border-red-200 p-4 dark:border-red-800">
            <h4 className="text-sm font-medium text-red-600 dark:text-red-400">
              Issues Detected
            </h4>
            {moduleCriticalAlerts.length > 0 && (
              <>
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                  Critical Alerts
                </p>
                <ul className="list-inside list-disc text-sm text-red-700 dark:text-red-400">
                  {moduleCriticalAlerts.map((alert, idx) => (
                    <li key={`crit-${idx}`}>
                      {alert
                        .replace(/^SM \d+ - /, "")
                        .replace(/^([a-z])/, (m) => m.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {moduleAlerts.length > 0 && (
              <>
                <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                  Warnings
                </p>
                <ul className="list-inside list-disc text-sm text-yellow-600 dark:text-yellow-400">
                  {moduleAlerts.map((alert, idx) => (
                    <li key={`warn-${idx}`}>
                      {alert
                        .replace(/^SM \d+ - /, "")
                        .replace(/^([a-z])/, (m) => m.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
        {moduleAllAlerts.length > 0 && (
          <div className="mt-4 border-t pt-2">
            <button
              className="flex items-center text-sm font-medium text-foreground hover:underline"
              onClick={() => setShowAllAlerts((prev) => !prev)}
            >
              {showAllAlerts ? (
                <ChevronDown className="mr-1 h-4 w-4" />
              ) : (
                <ChevronRight className="mr-1 h-4 w-4" />
              )}
              All Alerts (Including Suppressed)
            </button>

            {showAllAlerts && (
              <div className="mt-2 max-h-40 overflow-y-auto pr-1">
                <ul className="list-inside list-disc text-sm text-muted-foreground">
                  {moduleAllAlerts.map((alert, idx) => {
                    const cleaned = alert
                      .replace(/^SM \d+ - /, "")
                      .replace(/^([a-z])/, (m) => m.toUpperCase());
                    return <li key={idx}>{cleaned}</li>;
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 text-primary"
            onClick={() => setNavigationURL(`/modules/${module.id}`)}
          >
            <AreaChart className="mr-2 h-4 w-4" />
            Explore Data
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-primary"
            onClick={() => setNavigationURL(`/query/add?smid=${module.id}`)}
          >
            <SearchCode className="mr-2 h-4 w-4" />
            Add to Query
          </Button>
        </div>
      </div>
      <div className="rounded-b-md border-t bg-neutral-50 p-3 dark:bg-black">
        {!getOnlineStatus() && (
          <div className="mb-2 flex items-center gap-2 text-xs text-red-500">
            <AlertTriangle className="h-3 w-3" />
            <span>
              Module is offline, data was last updated on{" "}
              {new Date(module.last_ping + "Z").toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Clock className="h-3 w-3" />
          <span>
            Last updated{" "}
            {formatDistanceToNow(new Date(module.last_ping + "Z"), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SensorModuleCard;
