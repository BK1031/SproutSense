import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function Map() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const baseStationMarkers = useRef<mapboxgl.Marker[]>([]);
  const sensorModuleMarkers = useRef<mapboxgl.Marker[]>([]);

  const fetchAndPlaceMarkers = async () => {
    if (!mapRef.current) return;

    try {
      const [baseRes, sensorRes] = await Promise.all([
        fetch("http://127.0.0.1:5050/api/base_stations"),
        fetch("http://127.0.0.1:5050/api/sensor_modules"),
      ]);

      const baseStations = await baseRes.json();
      const sensorModules = await sensorRes.json();

      // Clear old markers
      baseStationMarkers.current.forEach(marker => marker.remove());
      sensorModuleMarkers.current.forEach(marker => marker.remove());
      baseStationMarkers.current = [];
      sensorModuleMarkers.current = [];

      // Add new base station markers
      baseStations.forEach((bs: any) => {
        const marker = new mapboxgl.Marker({ color: "blue" })
          .setLngLat([bs.longitude, bs.latitude])
          .setPopup(new mapboxgl.Popup().setText(`Base Station: ${bs.name}`))
          .addTo(mapRef.current!);
        baseStationMarkers.current.push(marker);
      });

      // Add new sensor module markers
      sensorModules.forEach((sm: any) => {
        const marker = new mapboxgl.Marker({ color: "green" })
          .setLngLat([sm.longitude, sm.latitude])
          .setPopup(new mapboxgl.Popup().setText(`Sensor Module: ${sm.name}`))
          .addTo(mapRef.current!);
        sensorModuleMarkers.current.push(marker);
      });
    } catch (error) {
      console.error("Error fetching marker data:", error);
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [12.550343, 55.665957],
      zoom: 8,
    });

    // Initial fetch
    fetchAndPlaceMarkers();

    // Poll every 10 seconds
    const intervalId = setInterval(fetchAndPlaceMarkers, 10000);

    return () => {
      clearInterval(intervalId);
      mapRef.current?.remove();
    };
  }, []);

  return (
    <div className="p-4 bg-gray-800 min-h-screen text-white">
      <header className="flex items-center justify-between p-4">
        <Link to="/" className="text-lg font-bold">
          SproutSense
        </Link>
        <button className="flex items-center rounded-md bg-green-500 px-3 py-1">
          Live <span className="ml-2">▼</span>
        </button>
      </header>
      <h2 className="text-xl font-bold mb-2">Map</h2>
      <p className="mb-4">Here you can view the map of your farm and sensor locations.</p>

      <div ref={mapContainer} className="w-full h-[70vh] rounded-lg shadow-md" />

      <footer className="fixed bottom-0 left-0 w-full bg-gray-900 p-4 flex justify-around">
        <Link to="/" className="text-gray-400 hover:text-white text-center">
          📊 <br />
          Statistics
        </Link>
        <Link to="/map" className="text-gray-400 hover:text-white text-center">
          📍 <br />
          Map
        </Link>
      </footer>
    </div>
  );
}

export default Map;