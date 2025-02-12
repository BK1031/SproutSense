import React from "react";
import { Link } from "react-router-dom";

function Statistics() {
  return (
    <div className="p-4 bg-gray-800 min-h-screen text-white">
        {/* Navbar */}
      <header className="flex items-center justify-between p-4">
      <Link
          to="/"
          className="text-lg font-bold"
        >
          SproutSense
        </Link>
        <button className="flex items-center bg-green-500 px-3 py-1 rounded-md">
          Live <span className="ml-2">▼</span>
        </button>
      </header>

      <h2 className="text-xl font-bold">Statistics</h2>
      <p>Here you can view detailed statistics about your crops.</p>
{/* Bottom Navigation */}
<footer className="fixed bottom-0 left-0 w-full bg-gray-900 p-4 flex justify-around">
        <Link
          to="/statistics"
          className="text-gray-400 hover:text-white text-center"
        >
          📊 <br />
          Statistics
        </Link>
        <Link
          to="/map"
          className="text-gray-400 hover:text-white text-center"
        >
          📍 <br />
          Map
        </Link>
      </footer>
    </div>
  );
}

export default Statistics;
