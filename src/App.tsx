import { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Home, Browse, Details, Chapter, Settings, ExtensionPage, History } from './pages';
import { Sidebar, createCustomTheme, useThemes, UpdateModal } from './components';
import { Box, CircularProgress } from '@mui/material';
import { check } from '@tauri-apps/plugin-updater';

function App() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [customColors, setCustomColors] = useState<any>(null);
  const [customShadows, setCustomShadows] = useState<any>(null);
  const [customTypography, setCustomTypography] = useState<any>(null);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const { themes, activeThemeFolder, loading, isInitialized, getTheme } = useThemes();
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update) {
          setUpdateDialogOpen(true);
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    checkForUpdates();
  }, []);

  const loadTheme = useCallback(async () => {
    try {
      if (activeThemeFolder) {
        const theme = await getTheme(activeThemeFolder);
        if (theme) {
          setThemeMode(theme.dark_mode ? 'dark' : 'light');
          setCustomColors(theme.colors || null);
          setCustomShadows(theme.shadows || null);
          setCustomTypography(theme.typography || null);
          setThemeLoaded(true);
          return;
        }
      }
      
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeMode(prefersDark ? 'dark' : 'light');
      setCustomColors(null);
      setCustomShadows(null);
      setCustomTypography(null);
      setThemeLoaded(true);
    } catch (err) {
      console.error('Failed to load theme:', err);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeMode(prefersDark ? 'dark' : 'light');
      setThemeLoaded(true);
    }
  }, [activeThemeFolder, getTheme]);

  useEffect(() => {
    if (isInitialized) {
      loadTheme();
    }
  }, [isInitialized, activeThemeFolder, loadTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('activeTheme')) {
        setThemeMode(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const theme = createCustomTheme(
    themeMode, 
    customColors || undefined, 
    customShadows || undefined, 
    customTypography || undefined
  );

  if (!themeLoaded || loading || !isInitialized) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', bgcolor: '#0d0d0d' }}>
        <CircularProgress sx={{ color: '#9333ea' }} />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Box sx={{ display: 'flex' }}>
          <Sidebar />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/history" element={<History />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/extension/:extensionId" element={<ExtensionPage />} />
              <Route path="/details/:extensionId/:bookId" element={<Details />} />
              <Route path="/chapter/:extensionId/:bookId/:chapterNumber" element={<Chapter />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
      </HashRouter>
      <UpdateModal
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
      />
    </ThemeProvider>
  );
}

export default App;