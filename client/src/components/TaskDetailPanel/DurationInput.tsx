import type { TaskDurationUnit } from "@kairos/shared";
import { TextInput } from "@mantine/core";

type DurationInputProps = {
  duration: string;
  durationUnit: TaskDurationUnit | "";
  onQtyChange: (qty: string, resolvedUnit: TaskDurationUnit | "") => void;
  onUnitChange: (unit: TaskDurationUnit | "") => void;
  onBlur: () => void;
};

const UNIT_OPTIONS: { value: TaskDurationUnit | ""; label: string }[] = [
  { value: "", label: "—" },
  { value: "h", label: "h" },
  { value: "d", label: "d" },
  { value: "w", label: "w" },
  { value: "m", label: "m" },
];

export function DurationInput({
  duration,
  durationUnit,
  onQtyChange,
  onUnitChange,
  onBlur,
}: DurationInputProps) {
  const handleQtyChange = (value: string) => {
    const resolvedUnit = value !== "" && durationUnit === "" ? "d" : durationUnit;
    onQtyChange(value, resolvedUnit);
  };

  return (
    <TextInput
      label="Duration"
      type="number"
      min={1}
      step={1}
      value={duration}
      onChange={(e) => handleQtyChange(e.target.value)}
      onBlur={onBlur}
      placeholder="e.g. 2"
      rightSectionWidth={48}
      rightSection={
        <select
          value={durationUnit}
          onChange={(e) => onUnitChange(e.target.value as TaskDurationUnit | "")}
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            fontSize: "var(--mantine-font-size-sm)",
            cursor: "pointer",
            color: "var(--mantine-color-dimmed)",
            outline: "none",
            padding: "0 4px",
          }}
        >
          {UNIT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      }
    />
  );
}
