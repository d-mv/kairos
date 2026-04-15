import type { PageMenuItem } from "../atoms/pageMenu.atom.js";

export function getProjectPageViewMenuItems(
  showGanttOption: boolean,
  view: "list" | "gantt",
  onListClick: () => void,
  onGanttClick: () => void,
): PageMenuItem[] {
  if (!showGanttOption) return [];

  return [
    {
      label: "List",
      section: "View",
      shortcut: "L",
      selected: view === "list",
      onClick: onListClick,
    },
    {
      label: "Gantt",
      section: "View",
      shortcut: "G",
      selected: view === "gantt",
      onClick: onGanttClick,
    },
  ];
}
