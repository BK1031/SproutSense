import { BaseStation } from "@/models/base-station";
import { SensorModule } from "@/models/sensor-module";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Leaf } from "lucide-react";
import { Satellite } from "lucide-react";
import SensorModuleCard from "@/components/map/SensorModuleCard";
import BaseStationCard from "@/components/map/BaseStationCard";

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="mb-2">
        {type === "sensor-module" && <SensorModuleCard module={data} />}
        {type === "base-station" && <BaseStationCard baseStation={data} />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
