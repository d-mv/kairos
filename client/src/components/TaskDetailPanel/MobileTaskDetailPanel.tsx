import type { TaskDurationUnit, TaskPriority } from "@kairos/shared";
import { SubtaskList } from "../SubtaskList";
import { Priority } from "../Priority";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { TrashIcon, XIcon } from "../ui/icons";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { SaveIndication } from "./SaveIndication";
import type { TaskDetailPanelController } from "./context";

type MobileTaskDetailPanelProps = {
  controller: TaskDetailPanelController;
};

export function MobileTaskDetailPanel({ controller }: MobileTaskDetailPanelProps) {
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
    <Dialog open>
      <DialogContent className="h-[90vh] w-[90vw] max-h-[90vh] max-w-[90vw] rounded-[1.2rem] p-0">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-end">
            <span>
              <SaveIndication saveState={saveState} />
              <Button
                onClick={handleClose}
                variant="ghost"
                size="icon"
                className="h-[3.2rem] w-[3.2rem] rounded-full"
                aria-label="Close task details"
              >
                <XIcon size={14} />
              </Button>
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="h-full w-full overflow-x-hidden overflow-y-auto px-2">
          <div className="group flex items-center gap-3 px-2 py-2">
            <Priority task={task} handleToggleComplete={handleToggleComplete(task)} />
            <div className="flex-1 rounded-md focus-within:bg-muted/50">
              <Textarea
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                onBlur={handleSave}
                placeholder="What needs to be done?"
                className="min-h-0 h-auto w-full border-none bg-transparent px-0 py-0 text-base shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          {saveError ? <p className="px-2 mt-2 text-xs text-destructive">{saveError}</p> : null}

          <div className="mt-3 space-y-3 px-2 pb-4">
            <div className="rounded-[1rem] border border-border/60 p-3">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSave}
                placeholder="Add a description..."
                rows={4}
                className="mt-2 min-h-[7.2rem] border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="rounded-[1rem] border border-border/60 p-3">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Status
              </span>
              <span
                className={`ml-2 rounded-full px-2.5 py-1 text-xs ${
                  task.status === "done"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                    : task.status === "in_progress"
                      ? "bg-muted text-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {task.status}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-[1rem] border border-border/60 p-3">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onChange={(e) => {
                    const nextPriority = Number(e.target.value) as TaskPriority;
                    setPriority(nextPriority);
                    void persistTaskChanges({ priority: nextPriority });
                  }}
                  className="mt-2"
                >
                  <option value={1}>P1</option>
                  <option value={2}>P2</option>
                  <option value={3}>P3</option>
                  <option value={4}>P4</option>
                </Select>
              </div>

              <div className="rounded-[1rem] border border-border/60 p-3">
                <Label>Due date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    const nextDueDate = e.target.value;
                    setDueDate(nextDueDate);
                    void persistTaskChanges({ dueDate: nextDueDate });
                  }}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-[1rem] border border-border/60 p-3">
                <Label>Duration</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  onBlur={handleSave}
                  placeholder="e.g. 2"
                  className="mt-2"
                />
              </div>
              <div className="rounded-[1rem] border border-border/60 p-3">
                <Label>Unit</Label>
                <Select
                  value={durationUnit}
                  onChange={(e) => {
                    const nextDurationUnit = e.target.value as TaskDurationUnit | "";
                    setDurationUnit(nextDurationUnit);
                    void persistTaskChanges({ durationUnit: nextDurationUnit });
                  }}
                  className="mt-2"
                >
                  <option value="">None</option>
                  <option value="h">Hours</option>
                  <option value="d">Days</option>
                  <option value="w">Weeks</option>
                  <option value="m">Months</option>
                </Select>
              </div>
            </div>

            {!task.parentTaskId && (
              <div className="rounded-[1rem] border border-border/60 p-3">
                <label className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  Subtasks
                </label>
                <SubtaskList parentTaskId={task.id} />
              </div>
            )}

            <div className="space-y-2">
              {!task.parentTaskId && (
                <Button onClick={handlePromote} className="w-full" variant="outline">
                  Promote to Project
                </Button>
              )}
              <Button
                onClick={handleDelete}
                className="w-full bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-500"
              >
                <TrashIcon size={16} />
                <span>Delete task</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
