import type { TaskDTO, TaskDurationUnit, TaskPriority } from "@kairos/shared";

export type TaskDetailPanelController = {
  task: TaskDTO;
  saveState: "idle" | "saving" | "saved" | "error";
  saveError: string | null;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  duration: string;
  durationUnit: TaskDurationUnit | "";
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setPriority: (value: TaskPriority) => void;
  setDueDate: (value: string) => void;
  setDuration: (value: string) => void;
  setDurationUnit: (value: TaskDurationUnit | "") => void;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handlePromote: () => Promise<void>;
  handleClose: () => void;
  handleToggleComplete: (task: TaskDTO) => () => Promise<void>;
  persistTaskChanges: (overrides?: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
    duration?: string;
    durationUnit?: TaskDurationUnit | "";
    silentValidation?: boolean;
  }) => Promise<void>;
};
