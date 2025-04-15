import { Link } from "react-router-dom";

function Map() {
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

      <h2 className="text-xl font-bold">Map</h2>
      <p>Here you can view the map of your farm and sensor locations.</p>

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
