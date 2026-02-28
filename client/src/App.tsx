import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAtom, useSetAtom } from "jotai";
import { sessionAtom, isAuthenticatedAtom } from "./atoms/auth.js";
import { areasAtom } from "./atoms/areas.js";
import { projectsAtom } from "./atoms/projects.js";
import { tasksAtom } from "./atoms/tasks.js";
import { workspaceErrorAtom, workspaceLoadingAtom, workspaceReadyAtom } from "./atoms/workspace.js";
import { supabase } from "./lib/supabase.js";
import { wsClient } from "./lib/ws.js";
import { lastWsEventAtom } from "./atoms/ws.js";
import { AppLayout } from "./components/AppLayout.js";

const LoginPage = lazy(() => import("./pages/LoginPage.js"));
const InboxPage = lazy(() => import("./pages/InboxPage.js"));
const ProjectPage = lazy(() => import("./pages/ProjectPage.js"));
const AreaPage = lazy(() => import("./pages/AreaPage.js"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="soft-panel rounded-[1.4rem] px-5 py-[1.6rem] text-sm text-muted-foreground">
        Loading workspace...
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useAtom(sessionAtom);
  const isAuthenticated = useAtom(isAuthenticatedAtom)[0];
  const setLastEvent = useSetAtom(lastWsEventAtom);
  const setAreas = useSetAtom(areasAtom);
  const setProjects = useSetAtom(projectsAtom);
  const setTasks = useSetAtom(tasksAtom);
  const setWorkspaceLoading = useSetAtom(workspaceLoadingAtom);
  const setWorkspaceReady = useSetAtom(workspaceReadyAtom);
  const setWorkspaceError = useSetAtom(workspaceErrorAtom);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthResolved(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthResolved(true);
    });

    return () => listener.subscription.unsubscribe();
  }, [setSession]);

  useEffect(() => {
    if (!session) {
      wsClient.disconnect();
      return;
    }

    wsClient.connect(session.access_token);
    const unsubscribe = wsClient.onEvent((event) => setLastEvent(event));
    return () => {
      unsubscribe();
    };
  }, [session, setLastEvent]);

  useEffect(() => {
    if (session) return;

    setAreas([]);
    setProjects([]);
    setTasks([]);
    setWorkspaceLoading(false);
    setWorkspaceReady(false);
    setWorkspaceError(null);
    setLastEvent(null);
  }, [
    session,
    setAreas,
    setLastEvent,
    setProjects,
    setTasks,
    setWorkspaceError,
    setWorkspaceLoading,
    setWorkspaceReady,
  ]);

  if (!authResolved) {
    return <RouteFallback />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {!isAuthenticated ? (
            <>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/inbox" replace />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/project/:id" element={<ProjectPage />} />
              <Route path="/area/:id" element={<AreaPage />} />
              <Route path="*" element={<Navigate to="/inbox" replace />} />
            </Route>
          )}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
