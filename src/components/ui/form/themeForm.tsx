import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaletteIcon from '@mui/icons-material/Palette';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { useThemes } from '~/components';

interface ThemeFormProps {
  onThemeChange?: () => void;
}

export function ThemeForm({ onThemeChange }: ThemeFormProps) {
  const theme = useTheme();
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { themes, activeThemeFolder, loading, setActiveTheme, loadThemes } = useThemes();

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  const handleActivateTheme = async (folder: string) => {
    try {
      await setActiveTheme(folder);
      setSnackbar({
        open: true,
        message: 'Theme activated successfully',
        severity: 'success',
      });
      setThemeDialogOpen(false);
      await loadThemes();
      if (onThemeChange) onThemeChange();
    } catch (error) {
      setSnackbar({
        open: true,
        message: (error as Error).message || 'Failed to activate theme',
        severity: 'error',
      });
    }
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const activeTheme = themes.find(t => t.folder === activeThemeFolder);

  return (
    <>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          mb: 3,
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
              Theme
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {activeThemeFolder ? `Active: ${activeTheme?.name || activeThemeFolder}` : 'Using default theme'}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ColorLensIcon />}
            onClick={() => setThemeDialogOpen(true)}
          >
            Change Theme
          </Button>
        </Box>

        {activeThemeFolder && activeTheme && activeTheme.colors && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            <Chip
              label="Colors"
              size="small"
              sx={{
                bgcolor: theme.palette.action.hover,
                color: theme.palette.text.secondary,
              }}
            />
            {Object.entries(activeTheme.colors)
              .slice(0, 4)
              .map(([key, value]) => (
                <Chip
                  key={key}
                  label={key}
                  size="small"
                  sx={{
                    bgcolor: value as string,
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                />
              ))}
          </Box>
        )}
      </Paper>

      <Dialog
        open={themeDialogOpen}
        onClose={() => setThemeDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            backdropFilter: 'blur(20px)',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            maxHeight: '80vh',
          }
        }}
      >
        <DialogTitle sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
          Select Theme
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: theme.palette.primary.main }} />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {themes.map((themeItem) => (
                <Grid item xs={12} sm={6} md={4} key={themeItem.folder}>
                  <Card
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      borderRadius: 2,
                      border: `1px solid ${activeThemeFolder === themeItem.folder ? `${theme.palette.primary.main}66` : theme.palette.divider}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.customShadows?.lg || '0 8px 24px rgba(0,0,0,0.3)',
                        borderColor: theme.palette.primary.main,
                      },
                      position: 'relative',
                    }}
                  >
                    <CardActionArea
                      onClick={() => handleActivateTheme(themeItem.folder)}
                      sx={{ p: 2 }}
                    >
                      {activeThemeFolder === themeItem.folder && (
                        <CheckCircleIcon
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: theme.palette.primary.main,
                            fontSize: 20,
                          }}
                        />
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            bgcolor: themeItem.colors?.primary || theme.palette.primary.main,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <PaletteIcon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 'medium' }}>
                            {themeItem.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {themeItem.dark_mode ? 'Dark' : 'Light'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {themeItem.colors && Object.values(themeItem.colors).slice(0, 5).map((color, index) => (
                          <Box
                            key={index}
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: 1,
                              bgcolor: color as string || '#666',
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          />
                        ))}
                      </Box>
                      {themeItem.description && (
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.disabled, display: 'block', mt: 1 }}
                        >
                          {themeItem.description}
                        </Typography>
                      )}
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setThemeDialogOpen(false)}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': { color: theme.palette.text.primary },
              textTransform: 'none',
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          sx={{ 
            bgcolor: theme.palette.background.paper, 
            color: theme.palette.text.primary,
            borderRadius: 2,
            '& .MuiAlert-icon': { color: snackbar.severity === 'success' ? theme.palette.success.main : theme.palette.error.main },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}