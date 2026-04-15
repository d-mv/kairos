import checkIsMobile from "is-mobile";
import { useAtomValue } from "jotai";
import { tasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { TaskCalendar } from "../components/TaskCalendar.js";
import { usePageTasks } from "../hooks/usePageTasks.js";
import { Box, Skeleton, Stack, Text, Title } from "@mantine/core";

export default function SchedulePage() {
  const tasks = useAtomValue(tasksAtom);
  const isWorkspaceLoading = useAtomValue(workspaceLoadingAtom);
  const isMobile = checkIsMobile();
  const isPageLoading = usePageTasks({ kind: "schedule" });
  const isLoading = isWorkspaceLoading || isPageLoading;
  const openTasks = tasks.filter((task) => task.status !== "done");
  const hasDatedOpenTasks = openTasks.some((task) => task.dueDate !== null);

  const p = isMobile ? "md" : "xl";

  return (
    <Box flex={1} style={{ overflowY: "auto" }}>
      <Box
        px={p}
        pt={p}
        pb="md"
        style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--mantine-color-body)" }}
      >
        <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
          Workspace
        </Text>
        <Title order={2}>Schedule</Title>
      </Box>
      <Box px={p} pb={p}>
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
