import { useState, useEffect } from 'react';
import { api } from '~/components';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
  Toolbar,
  CssBaseline,
  Chip,
  Snackbar,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { SourceForm, ThemeForm } from '~/components';

export function Settings() {
  const theme = useTheme();
  const [userAgents, setUserAgents] = useState<string[]>([]);
  const [newUserAgent, setNewUserAgent] = useState('');
  const [userAgentsLoading, setUserAgentsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadUserAgents = async () => {
    try {
      setUserAgentsLoading(true);
      const agents = await api.settings.getUserAgents();
      setUserAgents(agents || []);
    } catch (error) {
      console.error('Failed to load user agents:', error);
    } finally {
      setUserAgentsLoading(false);
    }
  };

  useEffect(() => {
    loadUserAgents();
  }, []);

  const handleAddUserAgent = async () => {
    if (!newUserAgent.trim()) return;
    
    const updated = [...userAgents, newUserAgent.trim()];
    setUserAgents(updated);
    setNewUserAgent('');
    
    try {
      setSaving(true);
      await api.settings.saveUserAgents(updated);
      setSnackbar({
        open: true,
        message: 'User agent added successfully',
        severity: 'success',
      });
      await loadUserAgents();
    } catch (error) {
      setSnackbar({
        open: true,
        message: (error as Error).message || 'Failed to save user agents',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveUserAgent = async (index: number) => {
    const updated = userAgents.filter((_, i) => i !== index);
    setUserAgents(updated);
    
    try {
      setSaving(true);
      await api.settings.saveUserAgents(updated);
      setSnackbar({
        open: true,
        message: 'User agent removed successfully',
        severity: 'success',
      });
      await loadUserAgents();
    } catch (error) {
      setSnackbar({
        open: true,
        message: (error as Error).message || 'Failed to remove user agent',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (userAgentsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <CssBaseline />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Container maxWidth="md">
          <SourceForm />
          <ThemeForm />

          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', mb: 1 }}>
              User Agents
            </Typography>
            
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
              Add user agents for extension requests
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Enter user agent string..."
                value={newUserAgent}
                onChange={(e) => setNewUserAgent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUserAgent();
                  }
                }}
                size="medium"
                sx={{
                  '& .MuioutlinedInput-root': {
                    color: theme.palette.text.primary,
                    '& fieldset': { borderColor: theme.palette.divider },
                    '&:hover fieldset': { borderColor: theme.palette.text.secondary },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                  },
                  '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
                }}
              />
              <Button
                variant="contained"
                onClick={handleAddUserAgent}
                disabled={!newUserAgent.trim() || saving}
                sx={{ 
                  minWidth: 120,
                  bgcolor: theme.palette.primary.main,
                  '&:hover': { bgcolor: theme.palette.primary.dark },
                  textTransform: 'none',
                }}
                startIcon={<AddIcon />}
              >
                {saving ? <CircularProgress size={24} /> : 'Add'}
              </Button>
            </Box>

            <Box sx={{ mt: 2 }}>
              {userAgents.length === 0 ? (
                <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
                  No user agents added
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {userAgents.map((agent, index) => (
                    <Chip
                      key={index}
                      label={agent}
                      onDelete={() => handleRemoveUserAgent(index)}
                      deleteIcon={<DeleteIcon />}
                      sx={{
                        color: theme.palette.text.primary,
                        bgcolor: theme.palette.action.hover,
                        borderColor: theme.palette.divider,
                        '&:hover': { bgcolor: theme.palette.action.selected },
                        '& .MuiChip-deleteIcon': { color: theme.palette.text.secondary },
                      }}
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>

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
    </Box>
  );
}