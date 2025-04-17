import { BaseStation } from "@/models/base-station";
import { SensorModule } from "@/models/sensor-module";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Leaf } from "lucide-react";
import { Satellite } from "lucide-react";

interface MapMarkerProps {
  data: BaseStation | SensorModule;
  type: "base-station" | "sensor-module";
}

export function MapMarker({ data, type }: MapMarkerProps) {
  const isOnline = () => {
    const lastPingTime = new Date(data.last_ping).getTime();
    const currentTime = new Date().getTime();
    const hourInMilliseconds = 60 * 60 * 1000;
    return currentTime - lastPingTime <= hourInMilliseconds;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`relative h-6 w-6 cursor-pointer rounded-full ${
              isOnline()
                ? type === "base-station"
                  ? "bg-blue-500"
                  : "bg-green-500"
                : "bg-neutral-400"
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center text-white">
              {type === "base-station" ? (
                <Satellite size={14} />
              ) : (
                <Leaf size={14} />
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="p-2">
            <h3 className="font-bold">{data.name}</h3>
            <p className="text-sm">ID: {data.id}</p>
            <p className="text-sm text-neutral-400">
              Last seen{" "}
              {formatDistanceToNow(new Date(data.last_ping), {
                addSuffix: true,
              })}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
