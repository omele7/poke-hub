import { useCallback, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'pokehub-theme';

function getInitialDarkModePreference(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored) {
    return stored === 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useThemeMode() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkModePreference);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleThemeMode = useCallback(() => {
    setIsDarkMode((current) => !current);
  }, []);

  return {
    isDarkMode,
    toggleThemeMode,
  };
}
