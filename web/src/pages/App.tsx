import React, { useState } from "react";
import { Link } from "react-router-dom";

function App() {
  const cards = [
    { id: 1, title: "Moisture level", value: "79/100", progress: 79 },
    {
      id: 2,
      title: "NPK",
      description: "Nitrogen: 20 mg/L\nPhosphorous: 20 mg/L\nPotassium: 20 mg/L",
    },
    { id: 3, title: "Temperature", value: "90 degrees fahrenheit" },
    { id: 4, title: "Humidity", value: "79/100", progress: 79 },
  ];

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Live");

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setIsDropdownOpen(false); // Close the dropdown after selecting an option
  };

  return (
    <div className="bg-gradient-to-b from-darkGray to-gray-800 min-h-screen p-4 text-white">
      {/* Navbar */}
      <header className="flex items-center justify-between p-4">
        <Link
          to="/"
          className="text-lg font-bold"
        >
          SproutSense
        </Link>
        <div className="relative">
          <button
            onClick={handleDropdownToggle}
            className="flex items-center bg-green-500 px-3 py-1 rounded-md"
          >
            {selectedOption} <span className="ml-2">▼</span>
          </button>
          {isDropdownOpen && (
            <ul className="absolute right-0 mt-2 bg-white text-black rounded-md shadow-lg w-48">
              <li
                onClick={() => handleOptionSelect("Live")}
                className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
              >
                Live
              </li>
              <li
                onClick={() => handleOptionSelect("Hourly")}
                className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
              >
                Hourly
              </li>
              <li
                onClick={() => handleOptionSelect("Daily")}
                className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
              >
                Daily
              </li>
              <li
                onClick={() => handleOptionSelect("Weekly")}
                className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
              >
                Weekly
              </li>
              <li
                onClick={() => handleOptionSelect("Monthly")}
                className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
              >
                Monthly
              </li>
              <li
                onClick={() => handleOptionSelect("Yearly")}
                className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
              >
                Yearly
              </li>
            </ul>
          )}
        </div>
      </header>

      {/* Cards */}
      <div className="space-y-4 mt-4">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className={`p-4 rounded-lg ${
              index % 2 === 0 ? "bg-cardGreen1" : "bg-cardGreen2"
            }`}
          >
            <h2 className="text-lg font-semibold">{card.title}</h2>
            {card.value && <p className="text-xl font-bold mt-2">{card.value}</p>}
            {card.description && (
              <pre className="text-sm whitespace-pre-line mt-2">
                {card.description}
              </pre>
            )}
            {card.progress !== undefined && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${card.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

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

export default App;
