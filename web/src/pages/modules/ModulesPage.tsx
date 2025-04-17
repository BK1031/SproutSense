import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/consts/config";
import { useRefreshInterval } from "@/lib/store";
import { SensorModule } from "@/models/sensor-module";
import { BaseStation } from "@/models/base-station";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import { toast } from "sonner";
import SensorModuleCard from "@/components/modules/SensorModuleCard";
import BaseStationCard from "@/components/modules/BaseStationCard";
import { useNavigate } from "react-router-dom";

export default function ModulesPage() {
  const refreshInterval = useRefreshInterval();
  const navigate = useNavigate();
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
      <div className="grid w-full grid-cols-1 gap-4 p-8 md:grid-cols-2">
        {baseStations.map((station) => (
          <div
            key={station.id}
            className="transition-transform hover:scale-[1.02] hover:cursor-pointer"
            onClick={() => {
              navigate(`/stations/${station.id}`);
            }}
          >
            <BaseStationCard station={station} />
          </div>
        ))}
        {sensorModules.map((module) => (
          <div
            key={module.id}
            className="transition-transform hover:scale-[1.02] hover:cursor-pointer"
            onClick={() => {
              navigate(`/modules/${module.id}`);
            }}
          >
            <SensorModuleCard module={module} />
          </div>
        ))}
      </div>
    </Layout>
  );
}
