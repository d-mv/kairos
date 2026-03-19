import { Box, Menu as MantineMenu, NavLink, Paper, Stack, Text } from "@mantine/core";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { areasAtom } from "../atoms/areas.js";
import { addEntityAtom } from "../atoms/addEntity.atom.js";
import { userAtom } from "../atoms/auth.js";
import {
  brainFoldersAtom,
  brainPagesAtom,
  brainPagesByFolderAtom,
  rootBrainPagesAtom,
  sortedBrainFoldersAtom,
} from "../atoms/brain.js";
import { shareDialogAtom } from "../atoms/shareDialog.js";
import { useIsActive } from "../lib/useIsActive.js";
import { api } from "../lib/api.js";
import { buildBrainTemplateContent, type BrainTemplateType } from "../lib/brain-templates.js";
import { AddNewEntityDialog } from "./AddEntityDialog.js";
import { SharedItemLabel } from "./SharedItemLabel.js";
import { SYSTEM_SIDEBAR_ITEMS } from "./data.js";

type SectionHeaderProps = {
  label: string;
  actions?: Array<{ label: string; onClick: () => void }>;
  menuActions?: Array<{ label: string; onClick: () => void }>;
};

function SectionHeader({ label, actions = [], menuActions = [] }: SectionHeaderProps) {
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
      <Text size="14px" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Box
        style={{
          display: "flex",
          gap: 4,
          opacity: hovered ? 1 : 0,
          transition: "opacity 120ms ease",
        }}
      >
        {menuActions.length > 0 ? (
          <MantineMenu withinPortal position="bottom-end">
            <MantineMenu.Target>
              <Box
                component="button"
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
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                }}
                aria-label="New brain item"
              >
                + New...
              </Box>
            </MantineMenu.Target>
            <MantineMenu.Dropdown>
              {menuActions.map((action) => (
                <MantineMenu.Item key={action.label} onClick={action.onClick}>
                  {action.label}
                </MantineMenu.Item>
              ))}
            </MantineMenu.Dropdown>
          </MantineMenu>
        ) : null}
        {actions.map((action) => (
          <Box
            key={action.label}
            component="button"
            onClick={action.onClick}
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
              fontSize: "14px",
              whiteSpace: "nowrap",
            }}
            aria-label={action.label}
          >
            + {action.label}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function Sidebar() {
  const areas = useAtomValue(areasAtom);
  const currentUser = useAtomValue(userAtom);
  const navigate = useNavigate();
  const isActive = useIsActive();
  const setAddEntity = useSetAtom(addEntityAtom);
  const setBrainFolders = useSetAtom(brainFoldersAtom);
  const setBrainPages = useSetAtom(brainPagesAtom);
  const setShareDialog = useSetAtom(shareDialogAtom);
  const brainFolders = useAtomValue(sortedBrainFoldersAtom);
  const rootBrainPages = useAtomValue(rootBrainPagesAtom);
  const brainPagesByFolder = useAtomValue(brainPagesByFolderAtom);

  const [openBrainFolders, setOpenBrainFolders] = useState<Record<string, boolean>>({});

  const createBrainFolder = async () => {
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;
    const folder = await api.brain.createFolder(name.trim());
    setBrainFolders((prev) => [...prev, folder]);
  };

  const createBrainPage = async (
    folderId?: string | null,
    template: BrainTemplateType = "blank",
  ) => {
    const url = template === "bookmark" ? (window.prompt("Bookmark URL")?.trim() ?? "") : "";
    if (template === "bookmark" && !url) return;
    const defaultTitle =
      template === "bookmark"
        ? (() => {
            try {
              return new URL(url).hostname.replace(/^www\./, "");
            } catch {
              return "Bookmark";
            }
          })()
        : template === "note"
          ? "New note"
          : "";
    const title = window.prompt("Page title", defaultTitle);
    if (!title?.trim()) return;
    const page = await api.brain.createPage({
      title: title.trim(),
      folderId: folderId ?? null,
      contentJson: buildBrainTemplateContent(template, { url }),
    });
    setBrainPages((prev) => [...prev, page]);
    navigate(`/brain/page/${page.id}`);
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
              styles={{ label: { fontSize: "16px" } }}
            />
          ))}

          <SectionHeader
            label="Areas"
            actions={[
              {
                label: "New Area",
                onClick: () => setAddEntity({ type: "area", entityLabel: "Area" }),
              },
            ]}
          />

          {areas.map((area) => (
            <NavLink
              key={area.id}
              label={area.name}
              active={isActive(`/area/${area.id}`)}
              onClick={() => navigate(`/area/${area.id}`)}
              style={{ borderRadius: 6 }}
              styles={{ label: { fontSize: "16px" } }}
            />
          ))}

          <SectionHeader
            label="Brain"
            menuActions={[
              { label: "Folder", onClick: () => void createBrainFolder() },
              { label: "Page", onClick: () => void createBrainPage(null, "blank") },
              { label: "Note", onClick: () => void createBrainPage(null, "note") },
              { label: "Bookmark", onClick: () => void createBrainPage(null, "bookmark") },
            ]}
          />
          {brainFolders.map((folder) => (
            <NavLink
              key={folder.id}
              label={
                <SharedItemLabel label={folder.name} shared={folder.userId !== currentUser?.id} />
              }
              style={{ borderRadius: 6 }}
              styles={{ label: { fontSize: "16px" } }}
              opened={openBrainFolders[folder.id] ?? true}
              onChange={(open) => setOpenBrainFolders((prev) => ({ ...prev, [folder.id]: open }))}
              childrenOffset={12}
            >
              <Box
                component="button"
                onClick={() => void createBrainPage(folder.id, "blank")}
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
              <Box
                component="button"
                onClick={() => void createBrainPage(folder.id, "note")}
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
                + New Note
              </Box>
              <Box
                component="button"
                onClick={() => void createBrainPage(folder.id, "bookmark")}
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
                + New Bookmark
              </Box>
              <Box
                component="button"
                onClick={() =>
                  setShareDialog({
                    entityType: "brain_folder",
                    entityId: folder.id,
                    entityLabel: folder.name,
                  })
                }
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
                Share Folder
              </Box>
              {(brainPagesByFolder.get(folder.id) ?? []).map((page) => (
                <NavLink
                  key={page.id}
                  label={
                    <SharedItemLabel label={page.title} shared={page.userId !== currentUser?.id} />
                  }
                  active={isActive(`/brain/page/${page.id}`)}
                  onClick={() => navigate(`/brain/page/${page.id}`)}
                  style={{ borderRadius: 6 }}
                  styles={{ label: { fontSize: "16px" } }}
                />
              ))}
            </NavLink>
          ))}
          {rootBrainPages.map((page) => (
            <NavLink
              key={page.id}
              label={
                <SharedItemLabel label={page.title} shared={page.userId !== currentUser?.id} />
              }
              active={isActive(`/brain/page/${page.id}`)}
              onClick={() => navigate(`/brain/page/${page.id}`)}
              style={{ borderRadius: 6 }}
              styles={{ label: { fontSize: "16px" } }}
            />
          ))}
        </Stack>
      </Paper>
      <AddNewEntityDialog />
    </>
  );
}
