import { createContext } from "react";

export const themes = ['light', 'dark', 'oli', 'oli-dark'] as const;
export type Theme = typeof themes[number];

export interface ThemeContextType {
  setTheme: (theme: Theme) => void
  theme: Theme
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);
