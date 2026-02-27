import { Button } from "./ui/button.js";
import { useTheme } from "./ThemeProvider.js";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </Button>
  );
}
