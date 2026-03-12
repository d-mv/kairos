import { Box, Drawer, NavLink, Stack, Text } from "@mantine/core";
import { useAtomValue, useSetAtom } from "jotai";
import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addEntityAtom } from "../atoms/addEntity.atom.js";
import { areasAtom } from "../atoms/areas.js";
import { pageMenuAtom } from "../atoms/pageMenu.atom.js";
import { projectsByAreaAtom } from "../atoms/projects.js";
import { useIsActive } from "../lib/useIsActive.js";
import { Menu } from "../shared/ui/Menu.js";
import { AddNewEntityDialog } from "./AddEntityDialog.js";
import { CalendarIcon, CheckCircleIcon, EllipsisHorizontalIcon, InboxIcon, SunSmallIcon } from "./ui/icons.js";

const SYSTEM_ITEMS = [
  { path: "/inbox", label: "Inbox", Icon: InboxIcon },
  { path: "/today", label: "Today", Icon: SunSmallIcon },
  { path: "/upcoming", label: "Upcoming", Icon: CalendarIcon },
  { path: "/completed", label: "Completed", Icon: CheckCircleIcon },
] as const;

const NAV_HEIGHT = 56;

export function MobileAppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const areas = useAtomValue(areasAtom);
  const projectsByArea = useAtomValue(projectsByAreaAtom);
  const pageMenuItems = useAtomValue(pageMenuAtom);
  const setAddEntity = useSetAtom(addEntityAtom);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});
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
    if (!drawerOpen) setOpenAreas({});
  }, [drawerOpen]);

  return (
    <Box style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <Box style={{ flex: 1, overflow: "auto", paddingBottom: NAV_HEIGHT }}>
        {children}
      </Box>
      {pageMenuItems.length > 0 && (
        <Box style={{ position: "fixed", top: 8, right: 8, zIndex: 200 }}>
          <Menu items={[]} topSection={pageMenuItems} />
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
              fontSize: "var(--mantine-font-size-xs)",
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
            fontSize: "var(--mantine-font-size-xs)",
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
            />
          ))}

          <Box
            px={8}
            pt={12}
            pb={2}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Areas</Text>
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
                fontSize: "var(--mantine-font-size-xs)",
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
                  onClick={() => { setDrawerOpen(false); navigate(`/area/${area.id}`); }}
                  style={{ borderRadius: 6 }}
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
              >
                {projects.map((project) => (
                  <NavLink
                    key={project.id}
                    label={project.name}
                    active={isActive(`/project/${project.id}`)}
                    onClick={() => navigate(`/project/${project.id}`)}
                    style={{ borderRadius: 6 }}
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
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Projects</Text>
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
                fontSize: "var(--mantine-font-size-xs)",
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
            />
          ))}
        </Stack>
      </Drawer>

      <AddNewEntityDialog />
    </Box>
  );
}
