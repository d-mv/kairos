import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAtom, useSetAtom } from "jotai";
import { sessionAtom, isAuthenticatedAtom } from "./atoms/auth.js";
import { supabase } from "./lib/supabase.js";
import { wsClient } from "./lib/ws.js";
import { lastWsEventAtom } from "./atoms/ws.js";
import LoginPage from "./pages/LoginPage.js";
import InboxPage from "./pages/InboxPage.js";
import ProjectPage from "./pages/ProjectPage.js";
import AreaPage from "./pages/AreaPage.js";
import { AppLayout } from "./components/AppLayout.js";

export default function App() {
  const [session, setSession] = useAtom(sessionAtom);
  const isAuthenticated = useAtom(isAuthenticatedAtom)[0];
  const setLastEvent = useSetAtom(lastWsEventAtom);

  // Initialize Supabase auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, [setSession]);

  // Connect WebSocket when authenticated
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

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
