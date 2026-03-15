import type { TaskDTO } from "@kairos/shared";
import { Box, Skeleton, Stack, Text, Title } from "@mantine/core";
import { TaskDetailPanel } from "../../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../../components/TaskList.js";

type CompletedPageMobileViewProps = {
  tasks: TaskDTO[];
  isLoading: boolean;
};

export function CompletedPageMobileView({ tasks, isLoading }: CompletedPageMobileViewProps) {
  return (
    <Box p="md">
      <Box mb="lg">
        <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
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
        <TaskList
          tasks={tasks}
          emptyMessage="No completed tasks"
          showNewTaskInput={false}
          appearance="mobile"
        />
      )}
      <TaskDetailPanel />
    </Box>
  );
}
