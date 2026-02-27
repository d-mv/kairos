import { useAtomValue } from "jotai";
import { inboxTasksAtom } from "../atoms/tasks.js";
import { TaskList } from "../components/TaskList.js";
import { TaskDetailPanel } from "../components/TaskDetailPanel.js";
import { selectedTaskIdAtom } from "../atoms/tasks.js";

export default function InboxPage() {
  const tasks = useAtomValue(inboxTasksAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);

  return (
    <div className="flex h-full flex-1">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "mr-[28rem]" : ""}`}>
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-8">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Overview
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Inbox</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Capture fast, sort later, and keep the next action close to the top.
            </p>
          </div>
          <TaskList tasks={tasks} emptyMessage="Your inbox is empty" />
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
