import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import mapboxgl from "mapbox-gl";

// Set your Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function Map() {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-119.8489, 34.4405], // Lane Farms coordinates
      zoom: 17,
    });

    const pins = [
      { id: 0, lng: -119.8489, lat: 34.4405 },
      { id: 1, lng: -119.8484, lat: 34.44 },
      { id: 2, lng: -119.8481, lat: 34.441 },
      { id: 3, lng: -119.848, lat: 34.4398 },
    ];

    pins.forEach((pin) => {
      const el = document.createElement("div");
      el.className = "marker";
      el.style.display = "flex";
      el.style.justifyContent = "center";
      el.style.alignItems = "flex-end"; // ensure image aligns to bottom
      el.style.width = "32px";
      el.style.height = "32px";

      const img = document.createElement("img");
      img.src = "https://cdn-icons-png.flaticon.com/512/684/684908.png";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.style.display = "block";

      el.appendChild(img);

      el.addEventListener("click", () => {
        alert(`Pin ${pin.id} clicked`);
      });

      new mapboxgl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);
    });

    return () => map.remove(); // Cleanup on unmount
  }, []);

  return (
    <div className="min-h-screen bg-gray-800 p-4 text-white">
      {/* Navbar */}
      <header className="flex items-center justify-between p-4">
        <Link to="/" className="text-lg font-bold">
          SproutSense
        </Link>
        <button className="flex items-center rounded-md bg-green-500 px-3 py-1">
          Live <span className="ml-2">▼</span>
        </button>
      </header>
      <h2 className="mb-2 text-xl font-bold">Map</h2>
      <p className="mb-4">
        Here you can view the map of your farm and sensor locations.
      </p>

      {/* Mapbox container */}
      <div
        ref={mapContainer}
        className="h-[70vh] w-full rounded-lg shadow-md"
      />

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 flex w-full justify-around bg-gray-900 p-4">
        <Link
          to="/statistics"
          className="text-center text-gray-400 hover:text-white"
        >
          📊 <br />
          Statistics
        </Link>
        <Link to="/map" className="text-center text-gray-400 hover:text-white">
          📍 <br />
          Map
        </Link>
      </footer>
    </div>
  );
}

export default Map;
