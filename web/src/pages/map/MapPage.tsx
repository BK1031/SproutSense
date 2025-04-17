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

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

export default function MapPage() {
  const refreshInterval = useRefreshInterval();
  const [sensorModules, setSensorModules] = useState<SensorModule[]>([]);
  const [baseStations, setBaseStations] = useState<BaseStation[]>([]);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { theme } = useTheme();

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
      }
    });

    // Add sensor module markers
    sensorModules.forEach((module) => {
      if (module.latitude && module.longitude) {
        const el = document.createElement("div");
        const root = createRoot(el);
        root.render(<MapMarker data={module} type="sensor-module" />);

        new mapboxgl.Marker(el)
          .setLngLat([module.longitude, module.latitude])
          .addTo(mapInstance);
      }
    });
  }, [baseStations, sensorModules]);

  return (
    <Layout activeTab="map" headerTitle="Map">
      <div className="h-full w-full">
        <div ref={mapContainer} className="h-full w-full" />
      </div>
    </Layout>
  );
}
