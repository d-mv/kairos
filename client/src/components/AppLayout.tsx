import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { useDataSync } from '../hooks/useDataSync.js';

export function AppLayout() {
  useDataSync();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
