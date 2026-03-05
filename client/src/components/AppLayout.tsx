import checkIsMobile from "is-mobile";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { workspaceErrorAtom, workspaceReloadAtom } from "../atoms/workspace.js";
import { useDataSync } from "../hooks/useDataSync.js";
import { MobileAppLayout } from "./MobileAppLayout.js";
import { Sidebar } from "./Sidebar.js";
import { Button } from "./ui/button.js";

export function AppLayout() {
  useDataSync();
  const error = useAtomValue(workspaceErrorAtom);
  const reloadWorkspace = useSetAtom(workspaceReloadAtom);

  const [isMobile, setIsMobile] = useState(checkIsMobile());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const errorPanel = (
    <div className="flex min-h-full items-center justify-center px-5 py-8">
      <div className="soft-panel w-full max-w-[36rem] rounded-[1.6rem] px-6 py-8 text-center">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
          Error
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">Workspace failed to load</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <div className="mt-6 flex items-center justify-center">
          <Button type="button" onClick={() => reloadWorkspace((tick) => tick + 1)}>
            Retry
          </Button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileAppLayout>
        {error && errorPanel}
        {!error && <Outlet />}
      </MobileAppLayout>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground lg:flex-row">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[18rem] bg-gradient-to-b from-accent/50 to-transparent" />
        {error && errorPanel}
        {!error && <Outlet />}
      </main>
    </div>
  );
}
