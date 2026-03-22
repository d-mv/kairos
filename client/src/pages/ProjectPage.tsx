import { useAtomValue, useSetAtom } from "jotai";
import checkIsMobile from "is-mobile";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { areasAtom } from "../atoms/areas.js";
import { userAtom } from "../atoms/auth.js";
import { pageMenuAtom } from "../atoms/pageMenu.atom.js";
import { projectsAtom as projAtom, projectsAtom } from "../atoms/projects.js";
import { shareDialogAtom } from "../atoms/shareDialog.js";
import { tasksAtom, tasksByProjectAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { SharedItemLabel } from "../components/SharedItemLabel.js";
import { TaskDetailPanel } from "../components/TaskDetailPanel/TaskDetailPanel.js";
import { ProjectGantt } from "../components/ProjectGantt.js";
import { TaskList } from "../components/TaskList.js";
import { usePageTasks } from "../hooks/usePageTasks.js";
import { api } from "../lib/api.js";
import { canShowProjectGantt } from "../lib/project-gantt.js";
import { getProjectPageViewMenuItems } from "../lib/project-page-menu.js";
import {
  Box,
  Button,
  Flex,
  Group,
  Modal,
  NativeSelect,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
  Badge,
} from "@mantine/core";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projects = useAtomValue(projectsAtom);
  const currentUser = useAtomValue(userAtom);
  const areas = useAtomValue(areasAtom);
  const tasksByProject = useAtomValue(tasksByProjectAtom);
  const isWorkspaceLoading = useAtomValue(workspaceLoadingAtom);
  const setProjects = useSetAtom(projAtom);
  const setTasks = useSetAtom(tasksAtom);
  const setPageMenu = useSetAtom(pageMenuAtom);
  const setShareDialog = useSetAtom(shareDialogAtom);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [view, setView] = useState<"list" | "gantt">("list");
  const [actionState, setActionState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const actionResetTimeoutRef = useRef<number | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [areaOpen, setAreaOpen] = useState(false);
  const [areaValue, setAreaValue] = useState("");
  const isPageLoading = usePageTasks(id ? { kind: "project", id } : null);
  const isLoading = isWorkspaceLoading || isPageLoading;

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

  const project = projects.find((p) => p.id === id);
  const tasks = id ? (tasksByProject.get(id) ?? []) : [];
  const visibleTasks = showCompleted ? tasks : tasks.filter((task) => task.status !== "done");
  const showGanttOption = canShowProjectGantt(visibleTasks);
  const projectName = project?.name ?? "Project";

  // Refs to always call latest handlers from stable menu closures
  const handleDeleteRef = useRef<() => void>(() => {});
  const handleDemoteRef = useRef<() => void>(() => {});
  const handleToggleCompleteRef = useRef<() => void>(() => {});

  useEffect(() => {
    setPageMenu([
      ...getProjectPageViewMenuItems(
        showGanttOption,
        view,
        () => setView("list"),
        () => setView("gantt"),
      ),
      {
        label: showCompleted ? "Hide Completed" : "Show Completed",
        onClick: () => setShowCompleted((c) => !c),
      },
      {
        label: "Share",
        onClick: () =>
          project &&
          setShareDialog({
            entityType: "project",
            entityId: project.id,
            entityLabel: project.name,
          }),
      },
      {
        label: "Rename",
        onClick: () => {
          setRenameError(null);
          setRenameValue(project?.name ?? "");
          setRenameOpen(true);
        },
      },
      {
        label: "Move to Area",
        onClick: () => {
          setAreaValue(project?.areaId ?? "");
          setAreaOpen(true);
        },
      },
      {
        label: project?.completedAt ? "Reopen Project" : "Complete Project",
        disabled: completeLoading,
        onClick: () => void handleToggleCompleteRef.current(),
      },
      {
        label: "Demote to Task",
        disabled: deleteLoading,
        onClick: () => handleDemoteRef.current(),
      },
      {
        label: "Delete",
        color: "red",
        disabled: deleteLoading,
        onClick: () => handleDeleteRef.current(),
      },
    ]);
    return () => setPageMenu([]);
  }, [
    completeLoading,
    deleteLoading,
    project?.areaId,
    project?.completedAt,
    project?.name,
    setPageMenu,
    showCompleted,
    showGanttOption,
    view,
  ]);

  useEffect(() => {
    if (!showGanttOption && view === "gantt") {
      setView("list");
    }
  }, [showGanttOption, view]);

  if (!project && !isLoading) {
    return (
      <Flex h="100%" align="center" justify="center">
        <Text c="dimmed">Project not found</Text>
      </Flex>
    );
  }

  const handleDemote = async () => {
    if (!id) return;
    try {
      const task = await api.projects.demote(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setTasks((prev) => [...prev.filter((t) => t.projectId !== id), task]);
      window.location.href = "/inbox";
    } catch (err) {
      console.error("Failed to demote project", err);
      alert((err as Error).message);
    }
  };

  const handleRename = async (name: string) => {
    if (!project) return;
    const previousProject = project;
    const optimisticProject = { ...project, name, updatedAt: new Date().toISOString() };
    setRenameLoading(true);
    setActionState("saving");
    setProjects((prev) => prev.map((item) => (item.id === project.id ? optimisticProject : item)));
    try {
      const updated = await api.projects.update(project.id, { name });
      setProjects((prev) => prev.map((item) => (item.id === project.id ? updated : item)));
      setActionState("saved");
    } catch (err) {
      setProjects((prev) => prev.map((item) => (item.id === project.id ? previousProject : item)));
      setActionState("error");
      throw err instanceof Error ? err : new Error("Failed to rename project");
    } finally {
      setRenameLoading(false);
      scheduleActionReset();
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    const hasTasks = tasks.length > 0;
    if (
      hasTasks &&
      !window.confirm(
        `Delete project "${project.name}"? All tasks in this project, including completed, will become unassigned.`,
      )
    ) {
      return;
    }

    const previousProject = project;
    const previousTasks = tasks.filter((task) => task.projectId === project.id);
    setDeleteLoading(true);
    setActionState("saving");
    setProjects((prev) => prev.filter((item) => item.id !== project.id));
    setTasks((prev) =>
      prev.map((item) => (item.projectId === project.id ? { ...item, projectId: null } : item)),
    );
    navigate("/inbox");

    try {
      await api.projects.delete(project.id);
    } catch (err) {
      setProjects((prev) => {
        if (prev.some((item) => item.id === previousProject.id)) return prev;
        return [...prev, previousProject];
      });
      setTasks((prev) =>
        prev.map((item) => {
          const previousTask = previousTasks.find((task) => task.id === item.id);
          return previousTask ?? item;
        }),
      );
      navigate(`/project/${project.id}`);
      setActionState("error");
      window.alert(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleMoveToArea = async (nextAreaId: string) => {
    if (!project) return;
    const areaId = nextAreaId || null;
    if (project.areaId === areaId) return;

    const previousProject = project;
    const optimisticProject = { ...project, areaId, updatedAt: new Date().toISOString() };
    setMoveLoading(true);
    setActionState("saving");
    setProjects((prev) => prev.map((item) => (item.id === project.id ? optimisticProject : item)));

    try {
      const updated = await api.projects.update(project.id, { areaId });
      setProjects((prev) => prev.map((item) => (item.id === project.id ? updated : item)));
      setActionState("saved");
    } catch (err) {
      setProjects((prev) => prev.map((item) => (item.id === project.id ? previousProject : item)));
      setActionState("error");
      window.alert(err instanceof Error ? err.message : "Failed to move project");
    } finally {
      setMoveLoading(false);
      scheduleActionReset();
    }
  };

  const handleToggleComplete = async () => {
    if (!project) return;

    const nextCompletedAt = project.completedAt ? null : new Date().toISOString();
    const previousProject = project;
    const optimisticProject = {
      ...project,
      completedAt: nextCompletedAt,
      updatedAt: new Date().toISOString(),
    };

    setCompleteLoading(true);
    setActionState("saving");
    setProjects((prev) => prev.map((item) => (item.id === project.id ? optimisticProject : item)));

    try {
      const updated = await api.projects.update(project.id, { completedAt: nextCompletedAt });
      setProjects((prev) => prev.map((item) => (item.id === project.id ? updated : item)));
      setActionState("saved");
      if (updated.completedAt) {
        navigate("/completed");
      }
    } catch (err) {
      setProjects((prev) => prev.map((item) => (item.id === project.id ? previousProject : item)));
      setActionState("error");
      window.alert(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setCompleteLoading(false);
      scheduleActionReset();
    }
  };

  handleDeleteRef.current = handleDelete;
  handleDemoteRef.current = handleDemote;
  handleToggleCompleteRef.current = handleToggleComplete;

  const isMobile = checkIsMobile();

  return (
    <Box flex={1} style={{ overflowY: "auto" }} p={isMobile ? "md" : "xl"}>
      <Box>
        <Box mb="lg">
          <Group gap="xs" align="center">
            <Title order={2}>
              <SharedItemLabel label={projectName} shared={project?.userId !== currentUser?.id} />
            </Title>
            {project?.completedAt ? <Badge color="green">Completed</Badge> : null}
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
        </Box>
        {isLoading ? (
          <Stack gap="sm">
            <Skeleton h={40} radius="sm" />
            <Skeleton h={40} radius="sm" />
            <Skeleton h={40} radius="sm" />
            <Skeleton h={40} radius="sm" />
          </Stack>
        ) : view === "gantt" ? (
          <ProjectGantt tasks={visibleTasks} />
        ) : (
          <TaskList
            isList
            tasks={tasks}
            projectId={id}
            emptyMessage="No tasks yet"
            hideCompleted={!showCompleted}
            appearance={isMobile ? "mobile" : "desktop"}
          />
        )}
      </Box>
      <TaskDetailPanel />

      <Modal
        opened={renameOpen}
        onClose={() => {
          if (renameLoading) return;
          setRenameOpen(false);
          setRenameError(null);
        }}
        title="Rename Project"
      >
        <TextInput
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const nextName = renameValue.trim();
            if (!nextName) {
              setRenameError("Project name is required");
              return;
            }
            void handleRename(nextName).then(
              () => setRenameOpen(false),
              (err: unknown) =>
                setRenameError(err instanceof Error ? err.message : "Failed to rename project"),
            );
          }}
          placeholder="Project name..."
          disabled={renameLoading}
          error={renameError}
          autoFocus
        />
        <Group justify="flex-end" mt="md">
          <Button
            variant="subtle"
            disabled={renameLoading}
            onClick={() => {
              setRenameOpen(false);
              setRenameError(null);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={renameLoading}
            onClick={() => {
              const nextName = renameValue.trim();
              if (!nextName) {
                setRenameError("Project name is required");
                return;
              }
              void handleRename(nextName).then(
                () => setRenameOpen(false),
                (err: unknown) =>
                  setRenameError(err instanceof Error ? err.message : "Failed to rename project"),
              );
            }}
          >
            {renameLoading ? "Saving..." : "Save"}
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={areaOpen}
        onClose={() => {
          if (moveLoading) return;
          setAreaOpen(false);
        }}
        title="Move to Area"
      >
        <NativeSelect
          value={areaValue}
          onChange={(e) => setAreaValue(e.target.value)}
          disabled={moveLoading}
          data={[
            { value: "", label: "Unassigned" },
            ...areas.map((area) => ({ value: area.id, label: area.name })),
          ]}
          autoFocus
        />
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" disabled={moveLoading} onClick={() => setAreaOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={moveLoading}
            onClick={() => void handleMoveToArea(areaValue).then(() => setAreaOpen(false))}
          >
            {moveLoading ? "Saving..." : "Save"}
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}
