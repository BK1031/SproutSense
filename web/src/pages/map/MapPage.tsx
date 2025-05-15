import Layout from "@/components/Layout";
import {
  BACKEND_URL,
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_DARK_STYLE,
  MAPBOX_LIGHT_STYLE,
} from "@/consts/config";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import { useRefreshInterval } from "@/lib/store";
import { BaseStation } from "@/models/base-station";
import { SensorModule } from "@/models/sensor-module";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapMarker } from "@/components/map/MapMarker";
import { createRoot } from "react-dom/client";
import { useTheme } from "@/components/theme-provider";
import BaseStationCard from "@/components/modules/BaseStationCard";
import SensorModuleCard from "@/components/modules/SensorModuleCard";
import BaseStationDialog from "@/components/map/BaseStationCard";
import SensorModuleDialog from "@/components/map/SensorModuleCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

export default function MapPage() {
  const navigate = useNavigate();
  const refreshInterval = useRefreshInterval();
  const [sensorModules, setSensorModules] = useState<SensorModule[]>([]);
  const [baseStations, setBaseStations] = useState<BaseStation[]>([]);
  const [selectedModule, setSelectedModule] = useState<
    BaseStation | SensorModule | null
  >(null);
  const [selectedType, setSelectedType] = useState<
    "base-station" | "sensor-module" | null
  >(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { theme } = useTheme();
  const [navigationURL, setNavigationURL] = useState<string | null>(null);
  // const markersRef = useRef<{marker: mapboxgl.Marker, root: ReturnType<typeof createRoot>}[]>([]);
  const rootsRef = useRef<ReturnType<typeof createRoot>[]>([]);

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
    const navUrl = navigationURL;

    if (navUrl) {
      rootsRef.current.forEach((root) => {
        root.unmount();
      });
      navigate(navUrl);
    }
  }, [navigationURL]);

  useEffect(() => {
    fetchModules();
    const interval = setInterval(fetchModules, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      center: [-119.847055, 34.412933],
      zoom: 15,
      style: theme === "dark" ? MAPBOX_DARK_STYLE : MAPBOX_LIGHT_STYLE,
    });

    // Add navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapInstance.addControl(new mapboxgl.GeolocateControl(), "top-right");

    map.current = mapInstance;

    return () => {
      mapInstance.remove();
    };
  }, []);

  useEffect(() => {
    if (map.current) {
      map.current.setStyle(
        theme === "dark" ? MAPBOX_DARK_STYLE : MAPBOX_LIGHT_STYLE,
      );
    }
  }, [theme]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    // Clear existing markers
    const markers = document.querySelectorAll(".mapboxgl-marker");
    markers.forEach((marker) => marker.remove());

    // Add base station markers
    baseStations.forEach((station) => {
      if (station.latitude && station.longitude) {
        const el = document.createElement("div");
        const root = createRoot(el);
        root.render(<MapMarker data={station} type="base-station" />);

        new mapboxgl.Marker(el)
          .setLngLat([station.longitude, station.latitude])
          .addTo(mapInstance);

        rootsRef.current.push(root);
      }
    });

    // Add sensor module markers
    sensorModules.forEach((module) => {
      if (module.latitude && module.longitude) {
        const el = document.createElement("div");
        const root = createRoot(el);
        root.render(
          <MapMarker
            data={module}
            type="sensor-module"
            setNavigationURL={setNavigationURL}
          />,
        );

        new mapboxgl.Marker(el)
          .setLngLat([module.longitude, module.latitude])
          .addTo(mapInstance);

        rootsRef.current.push(root);
      }
    });
  }, [baseStations, sensorModules]);

  return (
    <Layout activeTab="map" headerTitle="Map">
      <div className="relative h-full w-full">
        <div className="absolute left-0 top-0 z-10 hidden h-full w-[450px] overflow-y-auto p-4 lg:flex">
          <div className="flex flex-col gap-4">
            {baseStations.map((station) => (
              <div
                key={station.id}
                className="transition-transform hover:scale-[1.02] hover:cursor-pointer"
                onClick={() => {
                  setSelectedModule(station);
                  setSelectedType("base-station");
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
                  setSelectedModule(module);
                  setSelectedType("sensor-module");
                }}
              >
                <SensorModuleCard module={module} />
              </div>
            ))}
          </div>
        </div>
        <div ref={mapContainer} className="h-full w-full" />
        <Dialog
          open={!!selectedModule}
          onOpenChange={() => setSelectedModule(null)}
        >
          <DialogContent className="max-w-2xl p-0">
            {selectedType === "base-station" && selectedModule && (
              <BaseStationDialog baseStation={selectedModule as BaseStation} />
            )}
            {selectedType === "sensor-module" && selectedModule && (
              <SensorModuleDialog
                module={selectedModule as SensorModule}
                setNavigationURL={
                  setNavigationURL as React.Dispatch<
                    React.SetStateAction<string | null>
                  >
                }
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
