import type { TaskDTO } from "@kairos/shared";
import { Box, Skeleton, Stack, Text, Title } from "@mantine/core";
import { TaskDetailPanel } from "../../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../../components/TaskList.js";

type InboxPageDesktopViewProps = {
  tasks: TaskDTO[];
  isLoading: boolean;
  hideCompleted: boolean;
};

export function InboxPageDesktopView({
  tasks,
  isLoading,
  hideCompleted,
}: InboxPageDesktopViewProps) {
  return (
    <Box flex={1} style={{ overflowY: "auto" }}>
      <Box
        px="xl"
        pt="xl"
        pb="md"
        style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--mantine-color-body)" }}
      >
        <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
          Overview
        </Text>
        <Title order={2}>Inbox</Title>
      </Box>
      <Box px="xl" pb="xl">
        {isLoading ? (
          <Stack gap="sm">
            <Skeleton h={40} radius="sm" />
            <Skeleton h={40} radius="sm" />
            <Skeleton h={40} radius="sm" />
            <Skeleton h={40} radius="sm" />
          </Stack>
        ) : (
          <TaskList
            isList
            tasks={tasks}
            emptyMessage="Your inbox is empty"
            hideCompleted={hideCompleted}
          />
        )}
      </Box>
      <TaskDetailPanel />
    </Box>
  );
}
