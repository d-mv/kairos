import type { TaskDTO } from "@kairos/shared";
import { ActionIcon, Box, Group, Modal, Stack, Text } from "@mantine/core";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import {
  getTaskCalendarAgendaTasks,
  getNextTaskCalendarMonth,
  getPreviousTaskCalendarMonth,
  getTaskCalendarData,
} from "../lib/task-calendar.js";

type Props = {
  tasks: TaskDTO[];
};

export function TaskCalendar({ tasks }: Props) {
  const initialMonth = useMemo(() => {
    const firstDatedTask = tasks.find((task) => task.dueDate !== null);
    return firstDatedTask?.dueDate ?? null;
  }, [tasks]);
  const [monthLabel, setMonthLabel] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const calendar = getTaskCalendarData(tasks, monthLabel ?? undefined);
  const agendaTasks = selectedDate ? getTaskCalendarAgendaTasks(tasks, selectedDate) : [];

  if (tasks.length === 0) {
    return <Text c="dimmed">No tasks yet</Text>;
  }

  if (!calendar) {
    return <Text c="dimmed">Add due dates to tasks to see a calendar view.</Text>;
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text fw={600}>{format(parseISO(calendar.monthLabel), "MMMM yyyy")}</Text>
        <Group gap={4}>
          <ActionIcon
            variant="subtle"
            aria-label="Previous calendar month"
            onClick={() => setMonthLabel(getPreviousTaskCalendarMonth(calendar.monthLabel))}
          >
            <Text fw={700}>{"‹"}</Text>
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            aria-label="Next calendar month"
            onClick={() => setMonthLabel(getNextTaskCalendarMonth(calendar.monthLabel))}
          >
            <Text fw={700}>{"›"}</Text>
          </ActionIcon>
        </Group>
      </Group>

      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
          <Text key={label} size="xs" fw={600} c="dimmed" ta="center">
            {label}
          </Text>
        ))}

        {calendar.weeks.flat().map((day) => (
          <Box
            key={day.date}
            component="button"
            type="button"
            onClick={() => setSelectedDate(day.date)}
            style={{
              minHeight: 116,
              padding: 8,
              borderRadius: 10,
              border: "1px solid var(--mantine-color-default-border)",
              background: day.inMonth
                ? "var(--mantine-color-body)"
                : "var(--mantine-color-default-hover)",
              overflow: "hidden",
              textAlign: "left",
              cursor: "pointer",
              appearance: "none",
            }}
          >
            <Text size="xs" fw={600} c={day.inMonth ? undefined : "dimmed"} mb={6}>
              {format(parseISO(day.date), "d")}
            </Text>
            <Stack gap={4}>
              {day.tasks.slice(0, 3).map((task) => (
                <Box
                  key={task.id}
                  style={{
                    padding: "4px 6px",
                    borderRadius: 8,
                    background: "var(--mantine-color-blue-light)",
                    color: "var(--mantine-color-blue-light-color)",
                  }}
                >
                  <Text size="xs" truncate>
                    {task.title}
                  </Text>
                </Box>
              ))}
              {day.tasks.length > 3 ? (
                <Text size="xs" c="dimmed">
                  +{day.tasks.length - 3} more
                </Text>
              ) : null}
            </Stack>
          </Box>
        ))}
      </Box>

      <Modal
        opened={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? format(parseISO(selectedDate), "MMMM d, yyyy") : "Agenda"}
      >
        {agendaTasks.length > 0 ? (
          <Stack gap="sm">
            {agendaTasks.map((task) => (
              <Box
                key={task.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--mantine-color-default-border)",
                }}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Text fw={500}>{task.title}</Text>
                  <Text size="xs" c="dimmed">
                    P{task.priority}
                  </Text>
                </Group>
              </Box>
            ))}
          </Stack>
        ) : (
          <Text c="dimmed">No tasks for this day.</Text>
        )}
      </Modal>
    </Stack>
  );
}
