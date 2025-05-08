import { createContext, useContext, useEffect, useState } from "react";

// Set the key we'll use in localStorage
const STORAGE_KEY = "selected-plant";

interface PlantContextType {
  selectedPlant: string;
  setSelectedPlant: (plant: string) => void;
}

const PlantContext = createContext<PlantContextType>({
  selectedPlant: "",
  setSelectedPlant: () => {},
});

export const PlantProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedPlant, setSelectedPlantState] = useState<string>("tomato");

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelectedPlantState(stored);
    }
  }, []);

  // Update state and persist to localStorage
  const setSelectedPlant = (plant: string) => {
    setSelectedPlantState(plant);
    localStorage.setItem(STORAGE_KEY, plant);
  };

  return (
    <PlantContext.Provider value={{ selectedPlant, setSelectedPlant }}>
      {children}
    </PlantContext.Provider>
  );
};

export const usePlant = () => useContext(PlantContext);