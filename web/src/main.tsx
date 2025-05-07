import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { Toaster } from "@/components/ui/sonner.tsx";
import Dashboard from "@/pages/Dashboard.tsx";
import { ThemeProvider } from "@/components/theme-provider";
import { PlantProvider } from "@/context/plantContext.tsx";
import DebugPage from "@/pages/DebugPage";
import ModulesPage from "@/pages/modules/ModulesPage";
import MapPage from "@/pages/map/MapPage";
import QueryPage from "@/pages/query/QueryPage";
import SettingsPage from "./pages/settingsPage";
const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/modules",
    element: <ModulesPage />,
  },
  {
    path: "/map",
    element: <MapPage />,
  },
  {
    path: "/query",
    element: <QueryPage />,
  },
  {
    path: "/debug",
    element: <DebugPage />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <PlantProvider>
        <RouterProvider router={router} />
        <Toaster />
      </PlantProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
