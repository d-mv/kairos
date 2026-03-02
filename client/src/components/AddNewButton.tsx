import { EntityType } from "@kairos/shared";
import { useSetAtom } from "jotai";
import { PropsWithChildren } from "react";
import { addEntityAtom } from "../atoms/addEntity.atom";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

type Props = {
  type: EntityType;
  label: string;
  className?: string;
};

export function AddNewButton({ children, type, label, className }: PropsWithChildren<Props>) {
  const setAddEntityDialog = useSetAtom(addEntityAtom);

  function handleClick() {
    setAddEntityDialog({
      entityLabel: label,
      type,
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        "justify-start rounded-2xl px-4 py-3 text-left text-sm font-light hover:bg-[var(--color-sidebar-accent)] hover:text-accent-foreground",
        className,
      )}
    >
      {children}
    </Button>
  );
}
