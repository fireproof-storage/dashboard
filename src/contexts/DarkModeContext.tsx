import React, { createContext, useContext, useState, useEffect } from "react";

const DarkModeContext = createContext();

function getDarkMode() {
  const storedDarkMode = localStorage.getItem("darkMode");
  const darkModePreference = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return storedDarkMode === "true" || darkModePreference;
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (!context) throw new Error("Darkmode context used outside of the Provider");
  return context;
}

export const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => getDarkMode());

  const toggleDarkMode = () => {
    setIsDarkMode(state => !state);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("darkMode", isDarkMode.toString());
  }, [isDarkMode]);

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}