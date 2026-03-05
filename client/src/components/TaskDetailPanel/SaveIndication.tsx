type Props = {
  saveState: "idle" | "saving" | "saved" | "error";
};

export function SaveIndication({ saveState }: Props) {
  if (saveState === "idle") return null;

  return (
    <span
      className={`rounded-full px-4 py-2 text-xs leading-none font-sans font-normal uppercase tracking-wider ${
        saveState === "saving"
          ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
          : saveState === "saved"
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "bg-destructive/15 text-destructive"
      }`}
    >
      {saveState === "saving" ? "Saving" : saveState === "saved" ? "Saved" : "Not saved"}
    </span>
  );
}
