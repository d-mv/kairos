import type { TaskDTO } from "@kairos/shared";
import { Box, Skeleton, Stack, Text, Title } from "@mantine/core";
import { TaskDetailPanel } from "../../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../../components/TaskList.js";
import { TodayWeatherHero } from "../../components/TodayWeatherHero.js";
import type { TodayWeatherSummary } from "../../lib/today-weather.js";

type TodayPageMobileViewProps = {
  tasks: TaskDTO[];
  isLoading: boolean;
  hideCompleted: boolean;
  weatherSummary: TodayWeatherSummary | null;
  weatherError: boolean;
};

export function TodayPageMobileView({
  tasks,
  isLoading,
  hideCompleted,
  weatherSummary,
  weatherError,
}: TodayPageMobileViewProps) {
  return (
    <Box p="md">
      <Box mb="lg">
        <Text size="14px" c="dimmed" tt="uppercase" fw={500}>
          Focus
        </Text>
        <Title order={2}>Today</Title>
      </Box>
      <TodayWeatherHero summary={weatherSummary} error={weatherError} />
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
          todayView
          showContext
        />
      )}
      <TaskDetailPanel />
    </Box>
  );
}
