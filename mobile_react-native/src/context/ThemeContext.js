import React, { createContext, useContext, useMemo, useState } from "react";

import { colorsForMode, typography } from "../ui/theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  const value = useMemo(() => {
    const colors = colorsForMode(isDark);
    return {
      isDark,
      colors,
      text: typography(colors),
      toggleTheme: () => setIsDark((current) => !current)
    };
  }, [isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useThemeMode must be used within ThemeProvider");
  return value;
}
