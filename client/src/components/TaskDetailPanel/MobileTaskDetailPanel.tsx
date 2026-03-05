import { Priority } from "../Priority";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { XIcon } from "../ui/icons";
import { TextArea } from "../ui/input";
import { SaveIndication } from "./SaveIndication";
import type { TaskDetailPanelController } from "./context";

type MobileTaskDetailPanelProps = {
  controller: TaskDetailPanelController;
};

export function MobileTaskDetailPanel({ controller }: MobileTaskDetailPanelProps) {
  const { saveState, saveError, task, title, setTitle, handleToggleComplete, handleClose, handleSave } =
    controller;

  const placeholder = "What needs to be done?";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave();
  };

  return (
    <Dialog open>
      <DialogContent className="h-[90vh] w-[90vw] max-h-[90vh] max-w-[90vw] rounded-[1.2rem]">
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
        <div className="flex-1 overflow-y-auto h-full w-full overflow-x-hidden">
          <form
            onSubmit={handleSubmit}
            className="group flex items-center border-none gap-3 py-2 px-4 w-full"
          >
            <Priority task={task} handleToggleComplete={handleToggleComplete(task)} />
            <div className="flex-1 rounded-md focus-within:bg-muted/50">
              <TextArea
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                placeholder={placeholder}
                className="h-auto max-w-[calc(100%-4rem)] flex-1 border-none bg-transparent w-full px-0 py-0 text-base shadow-none focus-visible:ring-0"
              />
            </div>
          </form>
          {saveError ? <p className="mt-2 text-xs text-destructive">{saveError}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
