import { useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { createContext, useContext, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme("light");
  const theme: Theme = computed === "dark" ? "dark" : "light";

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setColorScheme,
        toggleTheme: () => setColorScheme(theme === "dark" ? "light" : "dark"),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
