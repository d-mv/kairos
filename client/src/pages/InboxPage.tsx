import { useAtomValue } from "jotai";
import { inboxTasksAtom } from "../atoms/tasks.js";
import { TaskList } from "../components/TaskList.js";
import { TaskDetailPanel } from "../components/TaskDetailPanel.js";
import { selectedTaskIdAtom } from "../atoms/tasks.js";

export default function InboxPage() {
  const tasks = useAtomValue(inboxTasksAtom);
  const selectedTaskId = useAtomValue(selectedTaskIdAtom);

  return (
    <div className="flex flex-1 h-full">
      <div className={`flex-1 overflow-y-auto ${selectedTaskId ? "mr-96" : ""}`}>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-6">Inbox</h1>
          <TaskList tasks={tasks} emptyMessage="Your inbox is empty" />
        </div>
      </div>
      {selectedTaskId && <TaskDetailPanel />}
    </div>
  );
}
