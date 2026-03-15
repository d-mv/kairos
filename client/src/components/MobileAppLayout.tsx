import { Box, Drawer, Menu as MantineMenu, NavLink, Stack, Text } from "@mantine/core";
import { useAtomValue, useSetAtom } from "jotai";
import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addEntityAtom } from "../atoms/addEntity.atom.js";
import { areasAtom } from "../atoms/areas.js";
import {
  brainFoldersAtom,
  brainPagesAtom,
  brainPagesByFolderAtom,
  rootBrainPagesAtom,
  sortedBrainFoldersAtom,
} from "../atoms/brain.js";
import { pageMenuAtom } from "../atoms/pageMenu.atom.js";
import { projectsByAreaAtom } from "../atoms/projects.js";
import { api } from "../lib/api.js";
import { useIsActive } from "../lib/useIsActive.js";
import { Menu, type MenuItem } from "../shared/ui/Menu.js";
import { AddNewEntityDialog } from "./AddEntityDialog.js";
import {
  CalendarIcon,
  CheckCircleIcon,
  EllipsisHorizontalIcon,
  InboxIcon,
  SunSmallIcon,
} from "./ui/icons.js";

const SYSTEM_ITEMS = [
  { path: "/inbox", label: "Inbox", Icon: InboxIcon },
  { path: "/today", label: "Today", Icon: SunSmallIcon },
  { path: "/upcoming", label: "Upcoming", Icon: CalendarIcon },
  { path: "/completed", label: "Completed", Icon: CheckCircleIcon },
] as const;

const NAV_HEIGHT = 56;

type Props = PropsWithChildren<{
  menuItems: MenuItem[];
}>;

export function MobileAppLayout({ children, menuItems }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const areas = useAtomValue(areasAtom);
  const brainFolders = useAtomValue(sortedBrainFoldersAtom);
  const rootBrainPages = useAtomValue(rootBrainPagesAtom);
  const brainPagesByFolder = useAtomValue(brainPagesByFolderAtom);
  const projectsByArea = useAtomValue(projectsByAreaAtom);
  const pageMenuItems = useAtomValue(pageMenuAtom);
  const setAddEntity = useSetAtom(addEntityAtom);
  const setBrainFolders = useSetAtom(brainFoldersAtom);
  const setBrainPages = useSetAtom(brainPagesAtom);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});
  const [openBrainFolders, setOpenBrainFolders] = useState<Record<string, boolean>>({});
  const isActive = useIsActive();

  const unassignedProjects = projectsByArea.get(null) ?? [];
  const projectsByAreaEntries = useMemo(
    () => areas.map((area) => ({ area, projects: projectsByArea.get(area.id) ?? [] })),
    [areas, projectsByArea],
  );

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) {
      setOpenAreas({});
      setOpenBrainFolders({});
    }
  }, [drawerOpen]);

  const createBrainFolder = async () => {
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;
    const folder = await api.brain.createFolder(name.trim());
    setBrainFolders((prev) => [...prev, folder]);
  };

  const createBrainPage = async (folderId?: string | null) => {
    const title = window.prompt("Page title");
    if (!title?.trim()) return;
    const page = await api.brain.createPage({
      title: title.trim(),
      folderId: folderId ?? null,
      contentJson: { type: "doc", version: 1, blocks: [{ type: "formatted_text", html: "" }] },
    });
    setBrainPages((prev) => [...prev, page]);
    setDrawerOpen(false);
    navigate(`/brain/page/${page.id}`);
  };

  return (
    <Box style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <Box style={{ flex: 1, overflow: "auto", paddingBottom: NAV_HEIGHT }}>{children}</Box>
      {(pageMenuItems.length > 0 || menuItems.length > 0) && (
        <Box style={{ position: "fixed", top: 8, right: 8, zIndex: 200 }}>
          <Menu items={menuItems} topSection={pageMenuItems} />
        </Box>
      )}

      <Box
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: NAV_HEIGHT,
          display: "flex",
          alignItems: "stretch",
          borderTop: "1px solid var(--mantine-color-default-border)",
          background: "var(--mantine-color-body)",
          zIndex: 100,
        }}
      >
        {SYSTEM_ITEMS.slice(0, 3).map((item) => (
          <Box
            key={item.path}
            component="button"
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: isActive(item.path)
                ? "var(--mantine-color-blue-filled)"
                : "var(--mantine-color-dimmed)",
              fontSize: "14px",
              fontWeight: isActive(item.path) ? 600 : 400,
            }}
          >
            <item.Icon size={20} />
            {item.label}
          </Box>
        ))}
        <Box
          component="button"
          onClick={() => setDrawerOpen(true)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "var(--mantine-color-dimmed)",
            fontSize: "14px",
          }}
          aria-label="Open full navigation"
        >
          <EllipsisHorizontalIcon size={20} />
          More
        </Box>
      </Box>

      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Workspace"
        position="left"
        size="xs"
      >
        <Stack gap={2}>
          {SYSTEM_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              label={item.label}
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
              style={{ borderRadius: 6 }}
              styles={{ label: { fontSize: "16px" } }}
            />
          ))}

          <Box
            px={8}
            pt={12}
            pb={2}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <Text size="14px" c="dimmed" tt="uppercase" fw={600}>
              Areas
            </Text>
            <Box
              component="button"
              onClick={() => setAddEntity({ type: "area", entityLabel: "Area" })}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: 4,
                color: "var(--mantine-color-dimmed)",
                fontSize: "14px",
              }}
            >
              + New Area
            </Box>
          </Box>

          {projectsByAreaEntries.map(({ area, projects }) => {
            if (projects.length === 0) {
              return (
                <NavLink
                  key={area.id}
                  label={area.name}
                  active={isActive(`/area/${area.id}`)}
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate(`/area/${area.id}`);
                  }}
                  style={{ borderRadius: 6 }}
                  styles={{ label: { fontSize: "16px" } }}
                />
              );
            }
            const expanded = openAreas[area.id] ?? false;
            return (
              <NavLink
                key={area.id}
                label={area.name}
                active={isActive(`/area/${area.id}`)}
                opened={expanded}
                onClick={() => {
                  if (expanded) {
                    setDrawerOpen(false);
                    navigate(`/area/${area.id}`);
                  } else {
                    setOpenAreas((prev) => ({ ...prev, [area.id]: true }));
                  }
                }}
                onChange={(open) => setOpenAreas((prev) => ({ ...prev, [area.id]: open }))}
                style={{ borderRadius: 6 }}
                childrenOffset={12}
                styles={{ label: { fontSize: "16px" } }}
              >
                {projects.map((project) => (
                  <NavLink
                    key={project.id}
                    label={project.name}
                    active={isActive(`/project/${project.id}`)}
                    onClick={() => navigate(`/project/${project.id}`)}
                    style={{ borderRadius: 6 }}
                    styles={{ label: { fontSize: "16px" } }}
                  />
                ))}
              </NavLink>
            );
          })}

          <Box
            px={8}
            pt={12}
            pb={2}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <Text size="14px" c="dimmed" tt="uppercase" fw={600}>
              Projects
            </Text>
            <Box
              component="button"
              onClick={() => setAddEntity({ type: "project", entityLabel: "Project" })}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: 4,
                color: "var(--mantine-color-dimmed)",
                fontSize: "14px",
              }}
            >
              + New Project
            </Box>
          </Box>

          {unassignedProjects.map((project) => (
            <NavLink
              key={project.id}
              label={project.name}
              active={isActive(`/project/${project.id}`)}
              onClick={() => navigate(`/project/${project.id}`)}
              style={{ borderRadius: 6 }}
              styles={{ label: { fontSize: "16px" } }}
            />
          ))}

          <Box
            px={8}
            pt={12}
            pb={2}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <Text size="14px" c="dimmed" tt="uppercase" fw={600}>
              Brain
            </Text>
            <MantineMenu withinPortal position="bottom-end">
              <MantineMenu.Target>
                <Box
                  component="button"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 4px",
                    borderRadius: 4,
                    color: "var(--mantine-color-dimmed)",
                    fontSize: "14px",
                  }}
                >
                  + New...
                </Box>
              </MantineMenu.Target>
              <MantineMenu.Dropdown>
                <MantineMenu.Item onClick={() => void createBrainFolder()}>Folder</MantineMenu.Item>
                <MantineMenu.Item onClick={() => void createBrainPage(null)}>Page</MantineMenu.Item>
              </MantineMenu.Dropdown>
            </MantineMenu>
          </Box>

          {brainFolders.map((folder) => (
            <NavLink
              key={folder.id}
              label={folder.name}
              opened={openBrainFolders[folder.id] ?? false}
              onChange={(open) => setOpenBrainFolders((prev) => ({ ...prev, [folder.id]: open }))}
              style={{ borderRadius: 6 }}
              childrenOffset={12}
              styles={{ label: { fontSize: "16px" } }}
            >
              <Box
                component="button"
                onClick={() => void createBrainPage(folder.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--mantine-color-dimmed)",
                  fontSize: "14px",
                  padding: "6px 12px",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                + New Page
              </Box>
              {(brainPagesByFolder.get(folder.id) ?? []).map((page) => (
                <NavLink
                  key={page.id}
                  label={page.title}
                  active={isActive(`/brain/page/${page.id}`)}
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate(`/brain/page/${page.id}`);
                  }}
                  style={{ borderRadius: 6 }}
                  styles={{ label: { fontSize: "16px" } }}
                />
              ))}
            </NavLink>
          ))}

          {rootBrainPages.map((page) => (
            <NavLink
              key={page.id}
              label={page.title}
              active={isActive(`/brain/page/${page.id}`)}
              onClick={() => {
                setDrawerOpen(false);
                navigate(`/brain/page/${page.id}`);
              }}
              style={{ borderRadius: 6 }}
              styles={{ label: { fontSize: "16px" } }}
            />
          ))}
        </Stack>
      </Drawer>

      <AddNewEntityDialog />
    </Box>
  );
}
