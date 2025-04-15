import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Set your Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function Map() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [12.550343, 55.665957],
      zoom: 8,
    });

    new mapboxgl.Marker()
      .setLngLat([12.554729, 55.70651])
      .addTo(mapRef.current);

    new mapboxgl.Marker({ color: "black", rotation: 45 })
      .setLngLat([12.65147, 55.608166])
      .addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return (
    <div className="p-4 bg-gray-800 min-h-screen text-white">
      {/* Navbar */}
      <header className="flex items-center justify-between p-4">
        <Link to="/" className="text-lg font-bold">
          SproutSense
        </Link>
        <button className="flex items-center bg-green-500 px-3 py-1 rounded-md">
          Live <span className="ml-2">▼</span>
        </button>
      </header>

      <h2 className="text-xl font-bold mb-2">Map</h2>
      <p className="mb-4">Here you can view the map of your farm and sensor locations.</p>

      {/* Mapbox container */}
      <div
        ref={mapContainer}
        className="w-full h-[70vh] rounded-lg shadow-md"
      />

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 w-full bg-gray-900 p-4 flex justify-around">
        <Link to="/statistics" className="text-gray-400 hover:text-white text-center">
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