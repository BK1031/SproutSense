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

  const fetchSoilMoistureData = async () => {
    try {
      const response = await axios.get(
        // `${BACKEND_URL}/query/latest?sensors=soil_moisture`
        `${BACKEND_URL}/query/latest?sensors=humidity`
      );
      console.log(response)
      if (response.data && response.data.soil_moisture) {
        const moduleData = Object.values(response.data.soil_moisture);
  
        const points = Object.entries(moduleData)
        .map(([moduleId, value]) => {
          const module = sensorModules.find((m) => m.id === Number(moduleId));
          if (!module || module.latitude == null || module.longitude == null) return null;

          return {
            latitude: module.latitude,
            longitude: module.longitude,
            value: Number(value)
          };
        })
  
        setSoilMoistureData(points);
      }
    } catch (error: any) {
      toast(getAxiosErrorMessage(error));
    }
  };

  // const fetchSoilMoistureData = () => { // fake data (for now)
  //   if (sensorModules.length === 0) return;

  //   const fakeData = [];

  //   for (const module of sensorModules) {
  //     if (module.latitude && module.longitude) {
  //       fakeData.push({
  //         latitude: module.latitude,
  //         longitude: module.longitude,
  //         value: Math.floor(Math.random() * 100) 
  //       });
        
  //       // more data for around the area
  //       for (let i = 0; i < 5; i++) {
  //         const latOffset = (Math.random() - 0.5) * 0.001; 
  //         const lngOffset = (Math.random() - 0.5) * 0.001;
          
  //         const baseValue = Math.floor(Math.random() * 100);
  //         const variation = Math.floor(Math.random() * 20) - 10; // +/- 10 from base value
  //         let value = baseValue + variation;
  //         value = Math.max(0, Math.min(100, value));
          
  //         fakeData.push({
  //           latitude: module.latitude + latOffset,
  //           longitude: module.longitude + lngOffset,
  //           value: value
  //         });
  //       }
  //     }
  //   }
  //   // if no modules, create data
  //   if (fakeData.length === 0) {
  //     const center = [-119.847055, 34.412933];
  //     for (let i = 0; i < 20; i++) {
  //       const latOffset = (Math.random() - 0.5) * 0.02;
  //       const lngOffset = (Math.random() - 0.5) * 0.02;
        
  //       fakeData.push({
  //         latitude: center[1] + latOffset,
  //         longitude: center[0] + lngOffset,
  //         value: Math.floor(Math.random() * 100)
  //       });
  //     }
  //   }

  //   setSoilMoistureData(fakeData);
  // };

  useEffect(() => {
    fetchModules();
    const interval = setInterval(fetchModules, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    if (showHeatmap) {
      fetchSoilMoistureData();
      const interval = setInterval(fetchSoilMoistureData, refreshInterval * 1000);
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
    mapInstance.on('load', () => {
      mapInstance.addSource('soil-moisture', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
      
      mapInstance.addLayer({
        id: 'soil-moisture-heat',
        type: 'heatmap',
        source: 'soil-moisture',
        layout: {
          visibility: 'none'
        },
        paint: {
          // increase the heatmap weight based on soil moisture value
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'value'],
            0, 0,
            100, 1
          ],
          // increase the heatmap color weight weight by zoom level
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 1,
            15, 3
          ],
          // color ramp for heatmap from dry (red) to wet (blue)
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(255,255,255,0)',
            0.2, 'rgb(253,210,145)',
            0.4, 'rgb(250,173,101)',
            0.6, 'rgb(179,205,227)',
            0.8, 'rgb(120,167,194)',
            1, 'rgb(67,147,195)'
          ],
          // adjust the heatmap radius by zoom level
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 15,
            16, 40
          ],
          // transition from heatmap to circle layer by zoom level
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 1,
            16, 0.6
          ],
        }
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
    if (!mapInstance || !mapInstance.getSource('soil-moisture')) return;
    
    if (soilMoistureData.length > 0) {
      const geoJsonData = {
        type: 'FeatureCollection',
        features: soilMoistureData.map(point => ({
          type: 'Feature',
          properties: {
            value: point.value
          },
          geometry: {
            type: 'Point',
            coordinates: [point.longitude, point.latitude]
          }
        }))
      };
      
      // @ts-ignore - TypeScript doesn't know about the GeoJSON structure
      mapInstance.getSource('soil-moisture').setData(geoJsonData);
      
      // Show or hide the layer based on toggle state
      mapInstance.setLayoutProperty(
        'soil-moisture-heat',
        'visibility',
        showHeatmap ? 'visible' : 'none'
      );
    }
  }, [soilMoistureData, showHeatmap]);

  // toggle heatmap visability
  const toggleHeatmap = () => {
    setShowHeatmap(prev => !prev);
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
