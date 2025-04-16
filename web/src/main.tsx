import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { Toaster } from "./components/ui/sonner.tsx";
import App from "./pages/App.tsx";
import Statistics from "../views/Statistics.tsx"; // Import the Statistics view
import Map from "../views/Map.tsx"; // Import the Map view

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/statistics",
    element: <Statistics />,
  },
  {
    path: "/map",
    element: <Map />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </React.StrictMode>,
);
