import React, { useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { ThemeContext, themes, type Theme } from "@/contexts/theme-context";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useLocalStorage<Theme>("theme", "oli");

  useEffect(() => {
    if (theme) {
      console.log(`Setting theme: ${theme}`)
      document.body.classList.add(theme)
      themes
      .filter((themeClass) => themeClass != theme)
      .forEach((themeClass) => document.body.classList.remove(themeClass))
      console.log(`body: ${document.body.classList}`)
    }
  }, [theme])

  function toggleTheme() {
    console.log(`toggling theme...${theme}}`)
    const index = themes.indexOf(theme);
    const nextIndex = (index + 1) % themes.length;
    setTheme(themes[nextIndex])
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
