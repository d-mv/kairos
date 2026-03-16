import type { ProjectDTO, TaskDTO } from "@kairos/shared";
import { Box, Button, Group, Skeleton, Stack, Text, Title } from "@mantine/core";
import { useSetAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { projectsAtom } from "../../atoms/projects.js";
import { TaskDetailPanel } from "../../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../../components/TaskList.js";
import { api } from "../../lib/api.js";

type CompletedPageMobileViewProps = {
  projects: ProjectDTO[];
  tasks: TaskDTO[];
  isLoading: boolean;
};

export function CompletedPageMobileView({
  projects,
  tasks,
  isLoading,
}: CompletedPageMobileViewProps) {
  const navigate = useNavigate();
  const setProjects = useSetAtom(projectsAtom);

  const handleReopen = async (project: ProjectDTO) => {
    const previousProject = project;
    const optimisticProject = {
      ...project,
      completedAt: null,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => prev.map((item) => (item.id === project.id ? optimisticProject : item)));
    try {
      const updated = await api.projects.update(project.id, { completedAt: null });
      setProjects((prev) => prev.map((item) => (item.id === project.id ? updated : item)));
      navigate(`/project/${project.id}`);
    } catch {
      setProjects((prev) => prev.map((item) => (item.id === project.id ? previousProject : item)));
    }
  };

  return (
    <Box p="md">
      <Box mb="lg">
        <Text size="14px" c="dimmed" tt="uppercase" fw={500}>
          Archive
        </Text>
        <Title order={2}>Completed</Title>
      </Box>
      {isLoading ? (
        <Stack gap="sm">
          <Skeleton h={40} radius="sm" />
          <Skeleton h={40} radius="sm" />
          <Skeleton h={40} radius="sm" />
          <Skeleton h={40} radius="sm" />
        </Stack>
      ) : (
        <Stack gap="xl">
          <Box>
            <Title order={4} mb="md">
              Projects
            </Title>
            {projects.length === 0 ? (
              <Text c="dimmed">No completed projects</Text>
            ) : (
              <Stack gap="xs">
                {projects.map((project) => (
                  <Group key={project.id} justify="space-between" align="center">
                    <Button
                      variant="subtle"
                      px={0}
                      onClick={() => navigate(`/project/${project.id}`)}
                    >
                      {project.name}
                    </Button>
                    <Button variant="light" size="xs" onClick={() => void handleReopen(project)}>
                      Reopen
                    </Button>
                  </Group>
                ))}
              </Stack>
            )}
          </Box>
          <Box>
            <Title order={4} mb="md">
              Tasks
            </Title>
            <TaskList
              tasks={tasks}
              emptyMessage="No completed tasks"
              showNewTaskInput={false}
              appearance="mobile"
            />
          </Box>
        </Stack>
      )}
      <TaskDetailPanel />
    </Box>
  );
}
