import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { Toaster } from "@/components/ui/sonner.tsx";
import Dashboard from "@/pages/Dashboard.tsx";
import { ThemeProvider } from "@/components/theme-provider";
import DebugPage from "@/pages/DebugPage";
import ModulesPage from "@/pages/modules/ModulesPage";

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
    path: "/debug",
    element: <DebugPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>,
);
