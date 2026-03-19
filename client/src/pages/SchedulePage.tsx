import checkIsMobile from "is-mobile";
import { useAtomValue } from "jotai";
import { tasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { TaskCalendar } from "../components/TaskCalendar.js";
import { Box, Skeleton, Stack, Text, Title } from "@mantine/core";

export default function SchedulePage() {
  const tasks = useAtomValue(tasksAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const isMobile = checkIsMobile();
  const openTasks = tasks.filter((task) => task.status !== "done");
  const hasDatedOpenTasks = openTasks.some((task) => task.dueDate !== null);

  return (
    <Box flex={1} style={{ overflowY: "auto" }} p={isMobile ? "md" : "xl"}>
      <Box maw={980}>
        <Box mb="xl">
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Workspace
          </Text>
          <Title order={2}>Schedule</Title>
        </Box>

        {isLoading ? (
          <Stack gap="sm">
            <Skeleton h={120} radius="sm" />
            <Skeleton h={120} radius="sm" />
            <Skeleton h={120} radius="sm" />
          </Stack>
        ) : hasDatedOpenTasks ? (
          <TaskCalendar tasks={openTasks} />
        ) : (
          <Text c="dimmed">No open tasks with due dates.</Text>
        )}
      </Box>
    </Box>
  );
}
