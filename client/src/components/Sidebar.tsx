import { ActionIcon, Box, NavLink, Paper, Stack, Text, Tooltip } from "@mantine/core";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { areasAtom } from "../atoms/areas.js";
import { addEntityAtom } from "../atoms/addEntity.atom.js";
import { projectsByAreaAtom } from "../atoms/projects.js";
import { useIsActive } from "../lib/useIsActive.js";
import { AddNewEntityDialog } from "./AddEntityDialog.js";
import { SYSTEM_SIDEBAR_ITEMS } from "./data.js";

const STORAGE_KEY = "kairos-sidebar-areas-open";

function loadOpenState(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveOpenState(state: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

type SectionHeaderProps = {
  label: string;
  onAdd: () => void;
  addLabel: string;
};

function SectionHeader({ label, onAdd, addLabel }: SectionHeaderProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      px={8}
      pt={12}
      pb={2}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Box
        component="button"
        onClick={onAdd}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 4px",
          borderRadius: 4,
          color: "var(--mantine-color-dimmed)",
          fontSize: "var(--mantine-font-size-xs)",
          whiteSpace: "nowrap",
          opacity: hovered ? 1 : 0,
          transition: "opacity 120ms ease",
        }}
        aria-label={addLabel}
      >
        + {addLabel}
      </Box>
    </Box>
  );
}

export function Sidebar() {
  const areas = useAtomValue(areasAtom);
  const projectsByArea = useAtomValue(projectsByAreaAtom);
  const navigate = useNavigate();
  const isActive = useIsActive();
  const setAddEntity = useSetAtom(addEntityAtom);

  const unassignedProjects = projectsByArea.get(null) ?? [];
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>(loadOpenState);

  const setAreaOpen = (areaId: string, open: boolean) => {
    setOpenAreas((prev) => {
      const next = { ...prev, [areaId]: open };
      saveOpenState(next);
      return next;
    });
  };

  return (
    <>
      <Paper
        w={240}
        p="sm"
        radius="md"
        style={{ flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <Stack gap={2} style={{ overflow: "auto", flex: 1 }}>
          {SYSTEM_SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              label={item.label}
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
              style={{ borderRadius: 6 }}
            />
          ))}

          <SectionHeader
            label="Areas"
            addLabel="New Area"
            onAdd={() => setAddEntity({ type: "area", entityLabel: "Area" })}
          />

          {areas.map((area) => {
            const areaProjects = projectsByArea.get(area.id) ?? [];
            return (
              <NavLink
                key={area.id}
                label={area.name}
                active={isActive(`/area/${area.id}`)}
                onClick={() => navigate(`/area/${area.id}`)}
                style={{ borderRadius: 6 }}
                opened={openAreas[area.id] ?? true}
                onChange={(open) => setAreaOpen(area.id, open)}
                childrenOffset={12}
              >
                {areaProjects.map((project) => (
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

          <SectionHeader
            label="Projects"
            addLabel="New Project"
            onAdd={() => setAddEntity({ type: "project", entityLabel: "Project" })}
          />
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
      </Paper>
      <AddNewEntityDialog />
    </>
  );
}
