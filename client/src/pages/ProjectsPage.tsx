import checkIsMobile from "is-mobile";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addEntityAtom } from "../atoms/addEntity.atom.js";
import { activeProjectsAtom } from "../atoms/projects.js";
import { pageMenuAtom } from "../atoms/pageMenu.atom.js";
import { userAtom } from "../atoms/auth.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { SharedItemLabel } from "../components/SharedItemLabel.js";
import { Box, Button, Skeleton, Stack, Text, Title } from "@mantine/core";

export default function ProjectsPage() {
  const projects = useAtomValue(activeProjectsAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const currentUser = useAtomValue(userAtom);
  const setPageMenu = useSetAtom(pageMenuAtom);
  const setAddEntity = useSetAtom(addEntityAtom);
  const navigate = useNavigate();
  const isMobile = checkIsMobile();

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
              projects.map((project) => (
                <Button
                  key={project.id}
                  variant="subtle"
                  px={0}
                  onClick={() => navigate(`/project/${project.id}`)}
                  fullWidth
                >
                  <SharedItemLabel
                    label={project.name}
                    shared={project.userId !== currentUser?.id}
                  />
                </Button>
              ))
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
