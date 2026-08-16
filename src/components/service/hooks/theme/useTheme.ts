import { useState, useEffect, useCallback } from 'react';
import { type Theme, loadAllThemes, loadThemeFromFile } from '~/components';

export function useThemes() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeThemeFolder, setActiveThemeFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadThemes = useCallback(async () => {
    try {
      setLoading(true);
      const allThemes = await loadAllThemes();
      setThemes(allThemes);
      
      const saved = localStorage.getItem('activeTheme');
      if (saved && allThemes.some(t => t.folder === saved)) {
        setActiveThemeFolder(saved);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const defaultTheme = prefersDark ? 'dark' : 'light';
        setActiveThemeFolder(defaultTheme);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load themes:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const getTheme = useCallback(async (folder: string) => {
    try {
      const theme = await loadThemeFromFile(folder);
      if (theme) return theme;
      const fallback = themes.find(t => t.folder === folder);
      if (fallback) return fallback;
      throw new Error(`Theme not found: ${folder}`);
    } catch (err) {
      console.error(`Failed to get theme ${folder}:`, err);
      throw err;
    }
  }, [themes]);

  const setActiveTheme = useCallback(async (folder: string) => {
    const theme = await getTheme(folder);
    if (theme) {
      setActiveThemeFolder(folder);
      localStorage.setItem('activeTheme', folder);
      return theme;
    }
    throw new Error(`Theme not found: ${folder}`);
  }, [getTheme]);

  const clearActiveTheme = useCallback(async () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = prefersDark ? 'dark' : 'light';
    setActiveThemeFolder(defaultTheme);
    localStorage.removeItem('activeTheme');
  }, []);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  return {
    themes,
    activeThemeFolder,
    loading,
    error,
    isInitialized,
    loadThemes,
    getTheme,
    setActiveTheme,
    clearActiveTheme,
  };
}