import { ActionIcon } from "@mantine/core";
import { useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { MoonIcon, SunIcon } from "./ui/icons.js";

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme("light");

  return (
    <ActionIcon
      variant="subtle"
      size="lg"
      onClick={() => setColorScheme(computed === "dark" ? "light" : "dark")}
      aria-label={`Switch to ${computed === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${computed === "dark" ? "light" : "dark"} theme`}
    >
      {computed === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </ActionIcon>
  );
}
