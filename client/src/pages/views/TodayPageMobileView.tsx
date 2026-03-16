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
  weatherLoading: boolean;
  weatherLocationName: string | null;
  weatherSummary: TodayWeatherSummary | null;
};

export function TodayPageMobileView({
  tasks,
  isLoading,
  hideCompleted,
  weatherLoading,
  weatherLocationName,
  weatherSummary,
}: TodayPageMobileViewProps) {
  return (
    <Box p="md">
      <Box mb="lg">
        <Text size="14px" c="dimmed" tt="uppercase" fw={500}>
          Focus
        </Text>
        <Title order={2}>Today</Title>
      </Box>
      <TodayWeatherHero
        locationName={weatherLocationName}
        summary={weatherSummary}
        loading={weatherLoading}
      />
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
