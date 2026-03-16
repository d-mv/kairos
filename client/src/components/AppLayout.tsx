import { Box, Flex } from "@mantine/core";
import { useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import checkIsMobile from "is-mobile";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { dialogsAtom } from "../atoms/dialogs.atom.js";
import { pageMenuAtom } from "../atoms/pageMenu.atom.js";
import { workspaceErrorAtom, workspaceReloadAtom } from "../atoms/workspace.js";
import { useDataSync } from "../hooks/useDataSync.js";
import { supabase } from "../lib/supabase.js";
import { Menu, type MenuItem } from "../shared/ui/Menu.js";
import { MobileAppLayout } from "./MobileAppLayout.js";
import { NotificationsMenu } from "./NotificationsMenu.js";
import { ShareDialog } from "./ShareDialog.js";
import { SettingsDialog } from "./SettingsDialog.js";
import { Sidebar } from "./Sidebar.js";

export function AppLayout() {
  useDataSync();
  const error = useAtomValue(workspaceErrorAtom);
  const reloadWorkspace = useSetAtom(workspaceReloadAtom);
  const pageMenuItems = useAtomValue(pageMenuAtom);
  const [isMobile, setIsMobile] = useState(checkIsMobile());
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme("light");
  const setDialogs = useSetAtom(dialogsAtom);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(checkIsMobile());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("dialog") !== "settings") return;
    setDialogs((prev) => (prev.includes("settingsDialog") ? prev : [...prev, "settingsDialog"]));
  }, [location.search, setDialogs]);

  const toggleTheme = () => setColorScheme(computed === "dark" ? "light" : "dark");

  const errorPanel = (
    <Flex align="center" justify="center" h="100%">
      <Box ta="center">
        <Box c="red" fw={600} mb={4}>
          Error
        </Box>
        <Box fw={600} mb={8}>
          Workspace failed to load
        </Box>
        <Box c="dimmed" mb={16}>
          {error}
        </Box>
        <button type="button" onClick={() => reloadWorkspace((tick) => tick + 1)}>
          Retry
        </button>
      </Box>
    </Flex>
  );

  const items: MenuItem[] = [
    {
      label: "Settings",
      shortcut: ",",
      onClick: () =>
        setDialogs((s) => (s.includes("settingsDialog") ? s : [...s, "settingsDialog"])),
    },
    { label: "Toggle theme", shortcut: "T", onClick: toggleTheme },
    {
      label: "MCP API Key",
      shortcut: "K",
      onClick: () => setDialogs((s) => (s.includes("apiKeyDialog") ? s : [...s, "apiKeyDialog"])),
    },
    { label: "Sign out", onClick: () => supabase.auth.signOut() },
  ];

  if (isMobile) {
    return (
      <MobileAppLayout menuItems={items}>
        {error && errorPanel}
        {!error && <Outlet />}
        <SettingsDialog />
        <ShareDialog />
      </MobileAppLayout>
    );
  }

  return (
    <Flex h="100dvh" style={{ overflow: "hidden", position: "fixed", inset: 0 }} p="md" gap="md">
      <Sidebar />
      <Box style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <Box
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <NotificationsMenu />
          <Menu items={items} topSection={pageMenuItems} />
        </Box>
        <Box h="100%" style={{ overflow: "hidden" }}>
          {error ? errorPanel : <Outlet />}
        </Box>
        <SettingsDialog />
        <ShareDialog />
      </Box>
    </Flex>
  );
}
