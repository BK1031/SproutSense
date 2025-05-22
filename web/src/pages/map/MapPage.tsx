import Layout from "@/components/Layout";
import {
  BACKEND_URL,
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_DARK_STYLE,
  MAPBOX_LIGHT_STYLE,
} from "@/consts/config";
import { getAxiosErrorMessage } from "@/lib/axios-error-handler";
import {
  useRefreshInterval,
  getFocusedSensorModuleId,
  setFocusedSensorModuleId,
} from "@/lib/store";
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
import { Button } from "@/components/ui/button";
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
  const rootsRef = useRef<ReturnType<typeof createRoot>[]>([]);

  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [soilMoistureData, setSoilMoistureData] = useState<any[]>([]);

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

  const fetchSoilMoistureData = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/query/latest?sensors=soil_moisture`
      );
      console.log(response)
      if (response.data && response.data.soil_moisture) {
      const value = response.data.soil_moisture;

      const points = sensorModules
        .filter((module) => module.latitude != null && module.longitude != null)
        .map((module) => ({
          latitude: module.latitude,
          longitude: module.longitude,
          value: value 
        }));

      setSoilMoistureData(points);
      
      }
    } catch (error: any) {
      toast(getAxiosErrorMessage(error));
    }
  };

  useEffect(() => {
    if (navigationURL) {
      rootsRef.current.forEach((root) => root.unmount());
      navigate(navigationURL);
    }
  }, [navigationURL]);

  useEffect(() => {
    fetchModules();
    const interval = setInterval(fetchModules, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    if (showHeatmap) {
      fetchSoilMoistureData();
      const interval = setInterval(
        fetchSoilMoistureData,
        refreshInterval * 1000,
      );
      return () => clearInterval(interval);
    }
  }, [showHeatmap, refreshInterval, sensorModules]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      center: [-119.847055, 34.412933],
      zoom: 15,
      style: theme === "dark" ? MAPBOX_DARK_STYLE : MAPBOX_LIGHT_STYLE,
    });

    mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapInstance.addControl(new mapboxgl.GeolocateControl(), "top-right");

    map.current = mapInstance;

    // set up heatmap layer
    mapInstance.on("load", () => {
      mapInstance.addSource("soil-moisture", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      mapInstance.addLayer({
        id: "soil-moisture-values",
        type: "circle",
        source: "soil-moisture",
        layout: {
          visibility: "none",
        },
        paint: {
          "circle-radius": 20,
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "value"],
            0,
            "#d7191c", // Very dry - red
            25,
            "#fdae61", // Dry - orange
            50,
            "#ffffbf", // Medium - yellow
            75,
            "#abd9e9", // Moist - light blue
            100,
            "#2c7bb6", // Very wet - dark blue
          ],
          "circle-opacity": 0.7,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });
    });

    return () => mapInstance.remove();
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

    const markers = document.querySelectorAll(".mapboxgl-marker");
    markers.forEach((marker) => marker.remove());

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

    sensorModules.forEach((module) => {
      if (module.latitude && module.longitude) {
        const el = document.createElement("div");
        el.dataset.markerId = module.id.toString();
        const root = createRoot(el);
        root.render(
          <MapMarker
            data={module}
            type="sensor-module"
            setNavigationURL={setNavigationURL}
            forceOpen={module.id === getFocusedSensorModuleId()}
          />,
        );
        new mapboxgl.Marker(el)
          .setLngLat([module.longitude, module.latitude])
          .addTo(mapInstance);
        rootsRef.current.push(root);
      }
    });
  }, [baseStations, sensorModules]);

  // updating heatmap when soil moisture data changes
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !mapInstance.getSource("soil-moisture")) return;

    if (soilMoistureData.length > 0) {
      const geoJsonData = {
        type: "FeatureCollection",
        features: soilMoistureData.map((point) => ({
          type: "Feature",
          properties: {
            value: point.value,
          },
          geometry: {
            type: "Point",
            coordinates: [point.longitude, point.latitude],
          },
        })),
      };

      // @ts-expect-error - TypeScript doesn't know about the GeoJSON structure
      mapInstance.getSource("soil-moisture").setData(geoJsonData);

      // Show or hide the layer based on toggle state
      mapInstance.setLayoutProperty(
        "soil-moisture-values",
        "visibility",
        showHeatmap ? "visible" : "none",
      );
    }
  }, [soilMoistureData, showHeatmap]);

  // toggle heatmap visability
  const toggleHeatmap = () => {
    setShowHeatmap((prev) => !prev);
  };

  useEffect(() => {
    const id = getFocusedSensorModuleId();
    if (!map.current || !id) return;

    const target = sensorModules.find((m) => m.id === id);
    if (!target) return;

    map.current.flyTo({
      center: [target.longitude, target.latitude],
      zoom: 16,
      essential: true,
    });

    const markerEl = document.querySelector(`[data-marker-id="${id}"]`);
    if (markerEl) (markerEl as HTMLElement).click();

    setFocusedSensorModuleId(null);
  }, [sensorModules]);

  // when clicking on sensor module or base station card, set the map to the location of the module
  useEffect(() => {
    if (!selectedModule) return;
    if (selectedType === "sensor-module") {
      const target = sensorModules.find((m) => m.id === selectedModule.id);
      if (target) {
        map.current?.flyTo({
          center: [target.longitude, target.latitude],
          zoom: 16,
          essential: true,
        });
        const markerEl = document.querySelector(
          `[data-marker-id="${target.id}"]`,
        );
        if (markerEl) (markerEl as HTMLElement).click();
      }
    } else if (selectedType === "base-station") {
      const target = baseStations.find((b) => b.id === selectedModule.id);
      if (target) {
        map.current?.flyTo({
          center: [target.longitude, target.latitude],
          zoom: 16,
          essential: true,
        });
        const markerEl = document.querySelector(
          `[data-marker-id="${target.id}"]`,
        );
        if (markerEl) (markerEl as HTMLElement).click();
      }
    }
  }, [selectedModule, selectedType]);

  return (
    <Layout activeTab="map" headerTitle="Map">
      <div className="relative h-full w-full">
        <div className="pointer-events-none absolute left-0 top-0 z-10 w-[450px] lg:flex">
          <div className="pointer-events-auto flex flex-col gap-4 p-4">
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
        <div className="absolute right-4 top-4 z-20">
          <Button
            onClick={toggleHeatmap}
            variant={showHeatmap ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            {showHeatmap ? "Hide Soil Moisture" : "Show Soil Moisture"}
          </Button>
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
                setNavigationURL={setNavigationURL}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
