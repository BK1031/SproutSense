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
import { useEffect, useState } from "react";

interface MapMarkerProps {
  data: BaseStation | SensorModule;
  type: "base-station" | "sensor-module";
  setNavigationURL?: React.Dispatch<React.SetStateAction<string | null>>;
  forceOpen?: boolean;
}

export function MapMarker({ data, type, setNavigationURL, forceOpen }: MapMarkerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const isOnline = () => {
    const lastPingTime = new Date(data.last_ping).getTime();
    const currentTime = new Date().getTime();
    return currentTime - lastPingTime <= 60 * 60 * 1000;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div
          data-marker-id={data.id}
          className={`relative h-6 w-6 cursor-pointer rounded-full ${
            isOnline()
              ? type === "base-station"
                ? "bg-blue-500"
                : "bg-green-500"
              : "bg-neutral-400"
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white">
            {type === "base-station" ? <Satellite size={14} /> : <Leaf size={14} />}
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="mb-2">
        {type === "sensor-module" ? (
          <SensorModuleCard
            module={data}
            setNavigationURL={setNavigationURL!}
          />
        ) : (
          <BaseStationCard baseStation={data} />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
