import type { TaskDTO } from "@kairos/shared";
import { Box, Stack, Text } from "@mantine/core";
import { format, parseISO } from "date-fns";
import { getProjectGanttData } from "../lib/project-gantt.js";

const DAY_WIDTH = 36;
const LABEL_WIDTH = 220;

const PRIORITY_COLOR: Record<number, string> = {
  1: "var(--mantine-color-red-6)",
  2: "var(--mantine-color-orange-6)",
  3: "var(--mantine-color-teal-6)",
  4: "var(--mantine-color-blue-6)",
};

type Props = {
  tasks: TaskDTO[];
};

export function ProjectGantt({ tasks }: Props) {
  const gantt = getProjectGanttData(tasks);

  if (tasks.length === 0) {
    return <Text c="dimmed">No tasks yet</Text>;
  }

  if (gantt.items.length === 0) {
    return <Text c="dimmed">Add due dates to tasks to see a Gantt view.</Text>;
  }

  const timelineWidth = gantt.columns.length * DAY_WIDTH;

  return (
    <Box style={{ overflowX: "auto", paddingBottom: 8 }}>
      <Box style={{ minWidth: LABEL_WIDTH + timelineWidth }}>
        <Box
          style={{
            display: "grid",
            gridTemplateColumns: `${LABEL_WIDTH}px ${timelineWidth}px`,
            alignItems: "end",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <Text size="sm" c="dimmed" fw={600}>
            Task
          </Text>
          <Box
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gantt.columns.length}, ${DAY_WIDTH}px)`,
            }}
          >
            {gantt.columns.map((column) => (
              <Box
                key={column}
                style={{
                  paddingBottom: 4,
                  borderBottom: "1px solid var(--mantine-color-default-border)",
                  textAlign: "center",
                }}
              >
                <Text size="xs" fw={600}>
                  {format(parseISO(column), "d")}
                </Text>
                <Text size="xs" c="dimmed">
                  {format(parseISO(column), "MMM")}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>

        <Stack gap="xs">
          {gantt.items.map((item) => {
            const barColor = PRIORITY_COLOR[item.task.priority] ?? PRIORITY_COLOR[4];

            return (
              <Box
                key={item.task.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: `${LABEL_WIDTH}px ${timelineWidth}px`,
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <Box style={{ minWidth: 0 }}>
                  <Text fw={500} truncate>
                    {item.task.title}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {item.startDate === item.endDate
                      ? format(parseISO(item.endDate), "MMM d")
                      : `${format(parseISO(item.startDate), "MMM d")} - ${format(parseISO(item.endDate), "MMM d")}`}
                  </Text>
                </Box>
                <Box
                  style={{
                    position: "relative",
                    height: 32,
                    borderRadius: 8,
                    backgroundImage: `linear-gradient(to right, var(--mantine-color-gray-2) 1px, transparent 1px)`,
                    backgroundSize: `${DAY_WIDTH}px 100%`,
                    backgroundPosition: "left top",
                  }}
                >
                  <Box
                    style={{
                      position: "absolute",
                      left: item.startOffsetDays * DAY_WIDTH + 4,
                      top: 4,
                      width: Math.max(item.spanDays * DAY_WIDTH - 8, 28),
                      height: 24,
                      borderRadius: 999,
                      background: barColor,
                      opacity: item.task.status === "done" ? 0.55 : 0.9,
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
