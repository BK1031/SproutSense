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
import { Button } from "@/components/ui/button";

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

export default function MapPage() {
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

  // const fetchSoilMoistureData = async () => {
  //   try {
  //     const response = await axios.get(
  //       `${BACKEND_URL}/query/latest?sensors=soil_moisture`
  //     );
  //     console.log(response)
  //     if (response.data && response.data.soil_moisture) {
  //       const moduleData = Object.values(response.data.soil_moisture);

  //       const points = Object.entries(moduleData)
  //       .map(([moduleId, value]) => {
  //         const module = sensorModules.find((m) => m.id === Number(moduleId));
  //         if (!module || module.latitude == null || module.longitude == null) return null;

  //         return {
  //           latitude: module.latitude,
  //           longitude: module.longitude,
  //           value: Number(value)
  //         };
  //       })

  //       setSoilMoistureData(points);
  //     }
  //   } catch (error: any) {
  //     toast(getAxiosErrorMessage(error));
  //   }
  // };

  const fetchSoilMoistureData = () => {
    // fake data (for now)
    if (sensorModules.length === 0) return;

    const fakeData = [];

    for (const module of sensorModules) {
      if (module.latitude && module.longitude) {
        fakeData.push({
          latitude: module.latitude,
          longitude: module.longitude,
          value: Math.floor(Math.random() * 100), // it will keep changing color because instead of actually pulling from soil moisture, just using random generate values as fake data
        });
      }
    }

    // // if no modules, create some fake data points
    // if (fakeData.length === 0) {
    //   const center = [-119.847055, 34.412933];
    //   for (let i = 0; i < 10; i++) {
    //     const latOffset = (Math.random() - 0.5) * 0.02;
    //     const lngOffset = (Math.random() - 0.5) * 0.02;

    //     fakeData.push({
    //       latitude: center[1] + latOffset,
    //       longitude: center[0] + lngOffset,
    //       value: Math.floor(Math.random() * 100)
    //     });
    //   }
    // }

    setSoilMoistureData(fakeData);
  };

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
  }, [showHeatmap, refreshInterval]);

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
              <SensorModuleDialog module={selectedModule as SensorModule} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
