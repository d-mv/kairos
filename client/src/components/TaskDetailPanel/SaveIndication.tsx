import { Badge } from "@mantine/core";

type Props = {
  saveState: "idle" | "saving" | "saved" | "error";
};

export function SaveIndication({ saveState }: Props) {
  if (saveState === "idle") return null;

  const color = saveState === "saved" ? "green" : saveState === "error" ? "red" : "gray";
  const label = saveState === "saving" ? "Saving" : saveState === "saved" ? "Saved" : "Not saved";

  return (
    <Badge size="sm" variant="light" color={color}>
      {label}
    </Badge>
  );
}
