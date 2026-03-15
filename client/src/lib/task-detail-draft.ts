import type { TaskDurationUnit, TaskPriority } from "@kairos/shared";

type TaskDetailDraft = {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  duration: string;
  durationUnit: TaskDurationUnit | "";
};

type TaskDetailSavedState = TaskDetailDraft & {
  savedTitle: string;
  savedDescription: string;
  savedPriority: TaskPriority;
  savedDueDate: string;
  savedDuration: string;
  savedDurationUnit: TaskDurationUnit | "";
};

export function hasTaskDetailDraftChanges(state: TaskDetailSavedState): boolean {
  return (
    JSON.stringify({
      title: state.savedTitle.trim(),
      description: state.savedDescription,
      priority: state.savedPriority,
      dueDate: state.savedDueDate,
      duration: state.savedDuration,
      durationUnit: state.savedDurationUnit,
    }) !==
    JSON.stringify({
      title: state.title.trim(),
      description: state.description,
      priority: state.priority,
      dueDate: state.dueDate,
      duration: state.duration,
      durationUnit: state.durationUnit,
    })
  );
}

export function getTaskDetailSavePayload(draft: TaskDetailDraft):
  | {
      ok: true;
      payload: {
        title: string;
        description: string | null;
        priority: TaskPriority;
        dueDate: string | null;
        duration: number | null;
        durationUnit: TaskDurationUnit | null;
      };
    }
  | { ok: false; error: string } {
  const title = draft.title.trim();
  if (!title) return { ok: false, error: "Title is required" };

  let duration: number | null = null;
  let durationUnit: TaskDurationUnit | null = null;

  if (draft.duration !== "") {
    duration = Number(draft.duration);
    if (!Number.isInteger(duration) || duration <= 0) {
      return { ok: false, error: "Duration must be a positive whole number" };
    }
  }

  if (draft.durationUnit !== "") durationUnit = draft.durationUnit;
  if ((duration === null) !== (durationUnit === null)) {
    return { ok: false, error: "Set both duration and duration unit, or leave both empty" };
  }

  return {
    ok: true,
    payload: {
      title,
      description: draft.description || null,
      priority: draft.priority,
      dueDate: draft.dueDate || null,
      duration,
      durationUnit,
    },
  };
}
