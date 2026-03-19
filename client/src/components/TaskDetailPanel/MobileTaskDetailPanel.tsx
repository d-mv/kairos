import type { TaskPriority } from "@kairos/shared";
import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Modal,
  NativeSelect,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useSetAtom } from "jotai";
import { shareDialogAtom } from "../../atoms/shareDialog.js";
import { DurationInput } from "./DurationInput.js";
import { SubtaskList } from "../SubtaskList.js";
import { Priority } from "../Priority.js";
import { TrashIcon, XIcon } from "../ui/icons.js";
import { SaveIndication } from "./SaveIndication.js";
import type { TaskDetailPanelController } from "./context.js";

type MobileTaskDetailPanelProps = {
  controller: TaskDetailPanelController;
};

export function MobileTaskDetailPanel({ controller }: MobileTaskDetailPanelProps) {
  const setShareDialog = useSetAtom(shareDialogAtom);
  const {
    saveState,
    saveError,
    task,
    title,
    description,
    priority,
    dueDate,
    duration,
    durationUnit,
    setTitle,
    setDescription,
    setPriority,
    setDueDate,
    setDuration,
    setDurationUnit,
    handleToggleComplete,
    handleClose,
    handleSave,
    handleDelete,
    handlePromote,
    persistTaskChanges,
  } = controller;

  return (
    <Modal opened fullScreen onClose={handleClose} withCloseButton={false} padding={0}>
      <Box style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Group
          justify="space-between"
          px="md"
          py="sm"
          style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
        >
          <Group gap="xs">
            <Title order={5}>Task</Title>
            <SaveIndication saveState={saveState} />
          </Group>
          <ActionIcon
            variant="subtle"
            size="md"
            onClick={handleClose}
            aria-label="Close task details"
          >
            <XIcon size={14} />
          </ActionIcon>
        </Group>

        <Stack gap="md" p="md" style={{ flex: 1, overflow: "auto" }}>
          <Group align="flex-start" gap="sm">
            <Priority task={task} handleToggleComplete={handleToggleComplete(task)} />
            <Textarea
              style={{ flex: 1 }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              placeholder="What needs to be done?"
              autosize
              minRows={1}
              autoFocus
            />
          </Group>

          {saveError ? (
            <Text size="xs" c="red">
              {saveError}
            </Text>
          ) : null}

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSave}
            placeholder="Add a description..."
            autosize
            minRows={3}
          />

          <Group gap="sm" align="flex-end" style={{ flexWrap: "nowrap" }}>
            <NativeSelect
              label="Priority"
              value={priority}
              w={68}
              onChange={(e) => {
                const nextPriority = Number(e.target.value) as TaskPriority;
                setPriority(nextPriority);
              }}
              onBlur={handleSave}
              data={[
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
              ]}
            />
            <Box style={{ flex: 1 }}>
              <TextInput
                label="Due date"
                type="date"
                value={dueDate}
                onChange={(e) => {
                  const nextDueDate = e.target.value;
                  setDueDate(nextDueDate);
                }}
                onBlur={handleSave}
              />
            </Box>
            <Box w={120}>
              <DurationInput
                duration={duration}
                durationUnit={durationUnit}
                onQtyChange={(qty, resolvedUnit) => {
                  setDuration(qty);
                  setDurationUnit(resolvedUnit);
                }}
                onUnitChange={(unit) => {
                  setDurationUnit(unit);
                }}
                onBlur={handleSave}
              />
            </Box>
          </Group>

          {!task.parentTaskId && (
            <Box>
              <Text size="sm" fw={500} mb={8}>
                Subtasks
              </Text>
              <SubtaskList parentTaskId={task.id} />
            </Box>
          )}
        </Stack>

        <Divider />
        <Group gap="sm" p="md">
          {!task.parentTaskId && (
            <Button variant="outline" size="sm" onClick={handlePromote}>
              Promote to Project
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setShareDialog({
                entityType: "task",
                entityId: task.id,
                entityLabel: task.title,
              })
            }
          >
            Share
          </Button>
          <Button
            variant="subtle"
            color="red"
            size="sm"
            leftSection={<TrashIcon size={14} />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}
