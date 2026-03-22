import checkIsMobile from "is-mobile";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { addEntityAtom } from "../atoms/addEntity.atom.js";
import { activeProjectsAtom } from "../atoms/projects.js";
import { pageMenuAtom } from "../atoms/pageMenu.atom.js";
import { tasksAtom } from "../atoms/tasks.js";
import { userAtom } from "../atoms/auth.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { SharedItemLabel } from "../components/SharedItemLabel.js";
import { usePageTasks } from "../hooks/usePageTasks.js";
import { Box, Button, Group, Skeleton, Stack, Text, Title } from "@mantine/core";
import { getProjectListItems } from "../lib/project-views.js";

const PRIORITY_COLOR: Record<number, string> = {
  1: "var(--mantine-color-red-6)",
  2: "var(--mantine-color-orange-6)",
  3: "var(--mantine-color-teal-6)",
};

export default function ProjectsPage() {
  const projects = useAtomValue(activeProjectsAtom);
  const tasks = useAtomValue(tasksAtom);
  const isWorkspaceLoading = useAtomValue(workspaceLoadingAtom);
  const currentUser = useAtomValue(userAtom);
  const setPageMenu = useSetAtom(pageMenuAtom);
  const setAddEntity = useSetAtom(addEntityAtom);
  const navigate = useNavigate();
  const isMobile = checkIsMobile();
  const isPageLoading = usePageTasks({ kind: "projects" });
  const isLoading = isWorkspaceLoading || isPageLoading;
  const projectItems = useMemo(() => getProjectListItems(projects, tasks), [projects, tasks]);

  useEffect(() => {
    setPageMenu([
      {
        label: "New Project",
        onClick: () => setAddEntity({ type: "project", entityLabel: "Project" }),
      },
    ]);
    return () => setPageMenu([]);
  }, [setPageMenu, setAddEntity]);

  return (
    <Box flex={1} style={{ overflowY: "auto" }} p={isMobile ? "md" : "xl"}>
      <Box>
        <Box mb="xl">
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Workspace
          </Text>
          <Title order={2}>Projects</Title>
        </Box>

        {isLoading ? (
          <Stack gap="sm">
            <Skeleton h={44} radius="sm" />
            <Skeleton h={44} radius="sm" />
            <Skeleton h={44} radius="sm" />
          </Stack>
        ) : (
          <Stack gap="sm">
            {projects.length === 0 ? (
              <Text c="dimmed">No projects</Text>
            ) : (
              projectItems.map(({ project, openTaskCount, highestPriority }) => (
                <Button
                  key={project.id}
                  variant="subtle"
                  px={0}
                  onClick={() => navigate(`/project/${project.id}`)}
                  fullWidth
                >
                  <Group justify="space-between" w="100%" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap">
                      {highestPriority && PRIORITY_COLOR[highestPriority] ? (
                        <Box
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: PRIORITY_COLOR[highestPriority],
                            flexShrink: 0,
                          }}
                        />
                      ) : null}
                      <SharedItemLabel
                        label={project.name}
                        shared={project.userId !== currentUser?.id}
                      />
                    </Group>
                    <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                      {openTaskCount}
                    </Text>
                  </Group>
                </Button>
              ))
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
