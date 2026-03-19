import { useAtom, useAtomValue, useSetAtom } from "jotai";
import checkIsMobile from "is-mobile";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addEntityAtom } from "../atoms/addEntity.atom.js";
import { areasAtom } from "../atoms/areas.js";
import { pageMenuAtom } from "../atoms/pageMenu.atom.js";
import { projectsAtom } from "../atoms/projects.js";
import { renameEntityAtom } from "../atoms/renameEntity.atom.js";
import { tasksAtom, tasksByAreaAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { RenameEntityDialog } from "../components/RenameEntityDialog.js";
import { ProjectGantt } from "../components/ProjectGantt.js";
import { TaskCalendar } from "../components/TaskCalendar.js";
import { TaskDetailPanel } from "../components/TaskDetailPanel/TaskDetailPanel.js";
import { TaskList } from "../components/TaskList.js";
import { api } from "../lib/api.js";
import { canShowProjectGantt } from "../lib/project-gantt.js";
import {
  Badge,
  Box,
  Flex,
  Group,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";

export default function AreaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const areas = useAtomValue(areasAtom);
  const tasksByArea = useAtomValue(tasksByAreaAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const setAreas = useSetAtom(areasAtom);
  const setProjects = useSetAtom(projectsAtom);
  const setTasks = useSetAtom(tasksAtom);
  const setPageMenu = useSetAtom(pageMenuAtom);
  const setAddEntity = useSetAtom(addEntityAtom);
  const [, setRenameEntityState] = useAtom(renameEntityAtom);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [view, setView] = useState<"list" | "gantt" | "calendar">("list");
  const [actionState, setActionState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const actionResetTimeoutRef = useRef<number | null>(null);

  const scheduleActionReset = () => {
    if (actionResetTimeoutRef.current) window.clearTimeout(actionResetTimeoutRef.current);
    actionResetTimeoutRef.current = window.setTimeout(() => {
      setActionState("idle");
      actionResetTimeoutRef.current = null;
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (actionResetTimeoutRef.current) window.clearTimeout(actionResetTimeoutRef.current);
    };
  }, []);

  const area = areas.find((a) => a.id === id);
  const tasks = id ? (tasksByArea.get(id) ?? []) : [];
  const showCalendarOption = canShowProjectGantt(tasks);
  const areaName = area?.name ?? "Area";

  // Refs to always call latest handlers from stable menu closures
  const handleDeleteRef = useRef<() => void>(() => {});
  const openRenameRef = useRef<() => void>(() => {});

  useEffect(() => {
    openRenameRef.current = () => {
      if (!area || !id) return;
      setRenameEntityState({
        entityId: id,
        entityLabel: "Area",
        currentName: areaName,
        type: "area",
        loading: false,
      });
    };
  });

  useEffect(() => {
    setPageMenu([
      {
        label: "New Project",
        onClick: () => setAddEntity({ type: "project", entityLabel: "Project", areaId: id }),
      },
      { label: "Rename", onClick: () => openRenameRef.current() },
      {
        label: "Delete",
        color: "red",
        disabled: deleteLoading,
        onClick: () => handleDeleteRef.current(),
      },
    ]);
    return () => setPageMenu([]);
  }, [setPageMenu, deleteLoading, setAddEntity]);

  useEffect(() => {
    if (!showCalendarOption && view !== "list") {
      setView("list");
    }
  }, [showCalendarOption, view]);

  if (!area && !isLoading) {
    return (
      <Flex h="100%" align="center" justify="center">
        <Text c="dimmed">Area not found</Text>
      </Flex>
    );
  }

  const handleRename = async (name: string) => {
    if (!area) return;
    const previousArea = area;
    const optimisticArea = { ...area, name, updatedAt: new Date().toISOString() };
    setActionState("saving");
    setAreas((prev) => prev.map((item) => (item.id === area.id ? optimisticArea : item)));
    try {
      const updated = await api.areas.update(area.id, name);
      setAreas((prev) => prev.map((item) => (item.id === area.id ? updated : item)));
      setActionState("saved");
    } catch (err) {
      setAreas((prev) => prev.map((item) => (item.id === area.id ? previousArea : item)));
      setActionState("error");
      throw err instanceof Error ? err : new Error("Failed to rename area");
    } finally {
      scheduleActionReset();
    }
  };

  const handleDelete = async () => {
    if (!area) return;
    if (
      tasks.length > 0 &&
      !window.confirm(`Delete area "${area.name}"? Tasks will move to inbox.`)
    ) {
      return;
    }

    const previousArea = area;
    const previousTasks = tasks.filter((task) => task.areaId === area.id);
    setDeleteLoading(true);
    setActionState("saving");
    setAreas((prev) => prev.filter((item) => item.id !== area.id));
    setProjects((prev) =>
      prev.map((item) => (item.areaId === area.id ? { ...item, areaId: null } : item)),
    );
    setTasks((prev) =>
      prev.map((item) => (item.areaId === area.id ? { ...item, areaId: null } : item)),
    );
    navigate("/inbox");

    try {
      await api.areas.delete(area.id);
    } catch (err) {
      setAreas((prev) => {
        if (prev.some((item) => item.id === previousArea.id)) return prev;
        return [...prev, previousArea];
      });
      setTasks((prev) =>
        prev.map((item) => previousTasks.find((task) => task.id === item.id) ?? item),
      );
      navigate(`/area/${area.id}`);
      setActionState("error");
      window.alert(err instanceof Error ? err.message : "Failed to delete area");
    } finally {
      setDeleteLoading(false);
    }
  };

  handleDeleteRef.current = handleDelete;

  const isMobile = checkIsMobile();

  return (
    <Box flex={1} style={{ overflowY: "auto" }} p={isMobile ? "md" : "xl"}>
      <Box maw={760}>
        <Box mb="xl">
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Area
          </Text>
          <Group gap="xs" align="center">
            <Title order={2}>{areaName}</Title>
            {actionState !== "idle" && (
              <Badge
                size="sm"
                variant="light"
                color={actionState === "saved" ? "green" : actionState === "error" ? "red" : "gray"}
              >
                {actionState === "saving"
                  ? "Updating"
                  : actionState === "saved"
                    ? "Updated"
                    : "Not saved"}
              </Badge>
            )}
          </Group>
          <SegmentedControl
            mt="sm"
            value={view}
            onChange={(value) => setView(value as "list" | "gantt" | "calendar")}
            data={
              showCalendarOption
                ? [
                    { label: "List", value: "list" },
                    { label: "Gantt", value: "gantt" },
                    { label: "Calendar", value: "calendar" },
                  ]
                : [
                    { label: "List", value: "list" },
                    { label: "Calendar", value: "calendar" },
                  ]
            }
          />
        </Box>

        <Box>
          <Title order={4} mb="md">
            Tasks
          </Title>
          {isLoading ? (
            <Stack gap="sm">
              <Skeleton h={40} radius="sm" />
              <Skeleton h={40} radius="sm" />
              <Skeleton h={40} radius="sm" />
              <Skeleton h={40} radius="sm" />
            </Stack>
          ) : view === "gantt" ? (
            <ProjectGantt tasks={tasks} />
          ) : view === "calendar" ? (
            <TaskCalendar tasks={tasks} />
          ) : (
            <TaskList
              tasks={tasks}
              areaId={id}
              emptyMessage="No tasks in this area"
              hideCompleted
              appearance={isMobile ? "mobile" : "desktop"}
            />
          )}
        </Box>
      </Box>
      <TaskDetailPanel />
      <RenameEntityDialog onRename={(name) => handleRename(name)} />
    </Box>
  );
}
