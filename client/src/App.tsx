import { useAtom, useSetAtom } from "jotai";
import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { areasAtom } from "./atoms/areas.js";
import { isAuthenticatedAtom, sessionAtom } from "./atoms/auth.js";
import { projectsAtom } from "./atoms/projects.js";
import { tasksAtom } from "./atoms/tasks.js";
import { workspaceErrorAtom, workspaceLoadingAtom, workspaceReadyAtom } from "./atoms/workspace.js";
import { lastWsEventAtom } from "./atoms/ws.js";
import { AppLayout } from "./components/AppLayout.js";
import { resolveInitialSession } from "./lib/auth-bootstrap.js";
import { supabase } from "./lib/supabase.js";
import { wsClient } from "./lib/ws.js";

const LoginPage = lazy(() => import("./pages/LoginPage.js"));
const InboxPage = lazy(() => import("./pages/InboxPage.js"));
const TodayPage = lazy(() => import("./pages/TodayPage.js"));
const UpcomingPage = lazy(() => import("./pages/UpcomingPage.js"));
const CompletedPage = lazy(() => import("./pages/CompletedPage.js"));
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
    resolveInitialSession(
      () => supabase.auth.getSession(),
      (error) => console.error("Failed to resolve auth session", error),
    )
      .then((nextSession) => {
        setSession(nextSession);
      })
      .finally(() => {
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
              <Route path="/today" element={<TodayPage />} />
              <Route path="/upcoming" element={<UpcomingPage />} />
              <Route path="/completed" element={<CompletedPage />} />
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
