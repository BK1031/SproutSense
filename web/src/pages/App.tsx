import React, { useState } from "react";
import { Link } from "react-router-dom";

function App() {
  const cards = [
    { id: 1, title: "Moisture level", value: "79/100", progress: 79 },
    {
      id: 2,
      title: "NPK",
      description:
        "Nitrogen: 20 mg/L\nPhosphorous: 20 mg/L\nPotassium: 20 mg/L",
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
    <div className="min-h-screen bg-gradient-to-b from-darkGray to-gray-800 p-4 text-white">
      {/* Navbar */}
      <header className="flex items-center justify-between p-4">
        <Link to="/" className="text-lg font-bold">
          SproutSense
        </Link>
        <div className="relative">
          <button
            onClick={handleDropdownToggle}
            className="flex items-center rounded-md bg-green-500 px-3 py-1"
          >
            {selectedOption} <span className="ml-2">▼</span>
          </button>
          {isDropdownOpen && (
            <ul className="absolute right-0 mt-2 w-48 rounded-md bg-white text-black shadow-lg">
              <li
                onClick={() => handleOptionSelect("Live")}
                className="cursor-pointer px-4 py-2 hover:bg-gray-200"
              >
                Live
              </li>
              <li
                onClick={() => handleOptionSelect("Hourly")}
                className="cursor-pointer px-4 py-2 hover:bg-gray-200"
              >
                Hourly
              </li>
              <li
                onClick={() => handleOptionSelect("Daily")}
                className="cursor-pointer px-4 py-2 hover:bg-gray-200"
              >
                Daily
              </li>
              <li
                onClick={() => handleOptionSelect("Weekly")}
                className="cursor-pointer px-4 py-2 hover:bg-gray-200"
              >
                Weekly
              </li>
              <li
                onClick={() => handleOptionSelect("Monthly")}
                className="cursor-pointer px-4 py-2 hover:bg-gray-200"
              >
                Monthly
              </li>
              <li
                onClick={() => handleOptionSelect("Yearly")}
                className="cursor-pointer px-4 py-2 hover:bg-gray-200"
              >
                Yearly
              </li>
            </ul>
          )}
        </div>
      </header>

      {/* Cards */}
      <div className="mt-4 space-y-4">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className={`rounded-lg p-4 ${
              index % 2 === 0 ? "bg-cardGreen1" : "bg-cardGreen2"
            }`}
          >
            <h2 className="text-lg font-semibold">{card.title}</h2>
            {card.value && (
              <p className="mt-2 text-xl font-bold">{card.value}</p>
            )}
            {card.description && (
              <pre className="mt-2 whitespace-pre-line text-sm">
                {card.description}
              </pre>
            )}
            {card.progress !== undefined && (
              <div className="mt-2">
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-600"
                    style={{ width: `${card.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

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

export default App;
