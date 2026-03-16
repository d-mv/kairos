import type { TaskDTO } from "@kairos/shared";
import { Box, Group, Text } from "@mantine/core";
import { useAtomValue } from "jotai";
import { type MouseEvent } from "react";
import type React from "react";
import { userAtom } from "../atoms/auth.js";
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
  onPointerDown,
}: Props) {
  const currentUser = useAtomValue(userAtom);
  const isDone = task.status === "done";
  const priorityColor = PRIORITY_COLOR[task.priority];
  const due = task.dueDate ? formatDueDate(task.dueDate) : null;
  const isMobile = appearance === "mobile";

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
      <Text
        size="16px"
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
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
      {due && (
        <Text
          size="xs"
          c={due.overdue ? "red" : "dimmed"}
          style={{ flexShrink: 0, whiteSpace: "nowrap" }}
        >
          {due.label} · {due.relative}
        </Text>
      )}
    </Group>
  );
}
