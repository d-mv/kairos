import type { TaskDTO } from "@kairos/shared";
import { Box, Group, Stack, Text } from "@mantine/core";
import { useAtomValue } from "jotai";
import { type MouseEvent } from "react";
import type React from "react";
import { userAtom } from "../atoms/auth.js";
import { areasAtom } from "../atoms/areas.js";
import { projectsAtom } from "../atoms/projects.js";
import { formatDueDate } from "../lib/utils.js";
import { renderTaskTitleMarkdown } from "../lib/task-title-markdown.js";
import { UserGroupIcon } from "./ui/heroicons.js";
import { Priority } from "./Priority.js";

const PRIORITY_COLOR: Record<number, string> = {
  1: "var(--mantine-color-red-6)",
  2: "var(--mantine-color-orange-6)",
  3: "var(--mantine-color-teal-6)",
};

type Props = {
  task: TaskDTO;
  isLast: boolean;
  isActive: boolean;
  appearance?: "desktop" | "mobile";
  isListItem?: boolean;
  isDragging?: boolean;
  todayView?: boolean;
  showContext?: boolean;
  handleClick?: (e: MouseEvent<HTMLElement>) => void;
  handleToggleComplete: () => void;
  onPointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
};

export function TaskItem({
  task,
  handleClick,
  handleToggleComplete,
  appearance = "desktop",
  isDragging = false,
  todayView = false,
  showContext = false,
  onPointerDown,
}: Props) {
  const currentUser = useAtomValue(userAtom);
  const projects = useAtomValue(projectsAtom);
  const areas = useAtomValue(areasAtom);
  const isDone = task.status === "done";

  const contextProject =
    showContext && task.projectId ? projects.find((p) => p.id === task.projectId) : null;
  const contextAreaId = task.areaId ?? contextProject?.areaId ?? null;
  const contextArea =
    showContext && contextAreaId ? areas.find((a) => a.id === contextAreaId) : null;
  const priorityColor = PRIORITY_COLOR[task.priority];
  const due = task.dueDate ? formatDueDate(task.dueDate) : null;
  const isMobile = appearance === "mobile";
  const contextLabel =
    showContext && (contextProject ?? contextArea)
      ? `${contextProject ? contextProject.name : ""}${contextProject && contextArea ? " " : ""}${contextArea ? `@${contextArea.name}` : ""}`
      : null;

  return (
    <Group
      gap="sm"
      px={isMobile ? 8 : 4}
      py={isMobile ? 12 : 6}
      onClick={handleClick}
      onPointerDown={onPointerDown}
      style={{
        cursor: "grab",
        borderRadius: 6,
        opacity: isDragging ? 0.35 : isDone ? 0.5 : 1,
        userSelect: "none",
      }}
    >
      <Priority task={task} handleToggleComplete={handleToggleComplete} />
      {priorityColor && (
        <Box
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: priorityColor,
            flexShrink: 0,
          }}
        />
      )}
      <Box
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <Stack gap={isMobile && contextLabel ? 2 : 0}>
          <Text size="16px" style={{ minWidth: 0 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                maxWidth: "100%",
                minWidth: 0,
                textDecoration: isDone ? "line-through" : "none",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {renderTaskTitleMarkdown(task.title)}
              </span>
              {task.userId !== currentUser?.id ? (
                <UserGroupIcon
                  width={14}
                  height={14}
                  style={{ flexShrink: 0, color: "var(--mantine-color-dimmed)" }}
                />
              ) : null}
            </span>
          </Text>
          {isMobile && contextLabel ? (
            <Text size="xs" c="dimmed" style={{ minWidth: 0 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {contextLabel}
              </span>
            </Text>
          ) : null}
        </Stack>
      </Box>
      {!isMobile && contextLabel ? (
        <Text size="xs" c="dimmed" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
          {contextLabel}
        </Text>
      ) : null}
      {due &&
        (todayView ? (
          due.overdue ? (
            <Text size="xs" c="red" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
              overdue
            </Text>
          ) : null
        ) : (
          <Text
            size="xs"
            c={due.overdue ? "red" : "dimmed"}
            style={{ flexShrink: 0, whiteSpace: "nowrap" }}
          >
            {due.label}
            {due.relative ? ` · ${due.relative}` : ""}
          </Text>
        ))}
    </Group>
  );
}
