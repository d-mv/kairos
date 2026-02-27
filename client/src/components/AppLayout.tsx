import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.js";
import { useDataSync } from "../hooks/useDataSync.js";

export function AppLayout() {
  useDataSync();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-accent/50 to-transparent" />
        <Outlet />
      </main>
    </div>
  );
}
