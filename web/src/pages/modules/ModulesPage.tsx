import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SystemLog, MqttLog } from "@/models/log";
import { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/consts/config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRefreshInterval } from "@/lib/store";
import { SensorModule } from "@/models/sensor-module";
import { BaseStation } from "@/models/base-station";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import { toast } from "sonner";
import { Leaf, Locate, LocateFixed, LocateOff, MapPin } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SensorModuleCard from "@/components/modules/SensorModuleCard";
import BaseStationCard from "@/components/modules/BaseStationCard";

export default function ModulesPage() {
  const refreshInterval = useRefreshInterval();
  const [sensorModules, setSensorModules] = useState<SensorModule[]>([]);
  const [baseStations, setBaseStations] = useState<BaseStation[]>([]);

  const fetchModules = () => {
    try {
      axios.get(`${BACKEND_URL}/sensor-module`).then((response) => {
        const sorted = response.data.sort((a: SensorModule, b: SensorModule) =>
          a.name.localeCompare(b.name),
        );
        setSensorModules(sorted);
      });
      axios.get(`${BACKEND_URL}/base-station`).then((response) => {
        const sorted = response.data.sort((a: BaseStation, b: BaseStation) =>
          a.name.localeCompare(b.name),
        );
        setBaseStations(sorted);
      });
    } catch (error: any) {
      toast(getAxiosErrorMessage(error));
    }
  };

  useEffect(() => {
    fetchModules();
    const interval = setInterval(fetchModules, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return (
    <Layout activeTab="modules" headerTitle="Modules">
      <div className="grid w-full grid-cols-1 gap-4 pb-14 md:grid-cols-2">
        {baseStations.map((station) => (
          <BaseStationCard key={station.id} station={station} />
        ))}
        {sensorModules.map((module) => (
          <SensorModuleCard key={module.id} module={module} />
        ))}
      </div>
    </Layout>
  );
}
