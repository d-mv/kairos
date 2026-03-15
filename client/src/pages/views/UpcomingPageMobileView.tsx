import type { TaskDTO } from "@kairos/shared";
import { Box, Group, Skeleton, Stack, Text, Title } from "@mantine/core";
import { TaskDetailPanel } from "../../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../../components/TaskList.js";
import { toDistance, toFormat } from "../../lib/utils.js";

type UpcomingPageMobileViewProps = {
  groupedTasks: [string, TaskDTO[]][];
  isLoading: boolean;
  hideCompleted: boolean;
};

export function UpcomingPageMobileView({
  groupedTasks,
  isLoading,
  hideCompleted,
}: UpcomingPageMobileViewProps) {
  return (
    <Box p="md">
      <Box mb="lg">
        <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
          Planning
        </Text>
        <Title order={2}>Upcoming</Title>
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
          {groupedTasks.map(([date, tasks]) => (
            <Box key={date}>
              <Group gap="xs" mb="sm">
                <Text size="sm" fw={600}>
                  {toDistance(date)}
                </Text>
                <Text size="sm" c="dimmed">
                  ({toFormat(date)})
                </Text>
              </Group>
              <TaskList
                active
                tasks={tasks}
                showNewTaskInput={false}
                appearance="mobile"
                hideCompleted={hideCompleted}
              />
            </Box>
          ))}
        </Stack>
      )}
      <TaskDetailPanel />
    </Box>
  );
}
