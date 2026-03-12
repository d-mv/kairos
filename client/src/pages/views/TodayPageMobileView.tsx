import type { TaskDTO } from "@kairos/shared";
import { Box, Skeleton, Stack, Text, Title } from "@mantine/core";
import { TaskDetailPanel } from "../../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../../components/TaskList.js";

type TodayPageMobileViewProps = {
  tasks: TaskDTO[];
  isLoading: boolean;
  hideCompleted: boolean;
};

export function TodayPageMobileView({
  tasks,
  isLoading,
  hideCompleted,
}: TodayPageMobileViewProps) {
  return (
    <Box p="md">
      <Box mb="lg">
        <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
          Focus
        </Text>
        <Title order={2}>Today</Title>
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
          emptyMessage="No tasks due today or overdue"
          showNewTaskInput={false}
          appearance="mobile"
          hideCompleted={hideCompleted}
        />
      )}
      <TaskDetailPanel />
    </Box>
  );
}
