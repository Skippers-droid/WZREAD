import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '~/components'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SourceIcon from '@mui/icons-material/Source'

export function SourceForm() {
  const theme = useTheme()
  const queryClient = useQueryClient()
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [newSourceName, setNewSourceName] = useState('')
  const [newSourceLink, setNewSourceLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [settingActive, setSettingActive] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const { data: sources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: () => api.sources.getAll(),
    staleTime: 5 * 60 * 1000,
  })

  const handleAddSource = async () => {
    if (!newSourceName.trim() || !newSourceLink.trim()) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields',
        severity: 'error',
      })
      return
    }

    try {
      setSaving(true)
      await api.sources.save({
        source_name: newSourceName,
        source_link: newSourceLink,
        is_active: sources.length === 0,
      })
      setSnackbar({
        open: true,
        message: `Source "${newSourceName}" added successfully`,
        severity: 'success',
      })
      setOpenAddDialog(false)
      setNewSourceName('')
      setNewSourceLink('')
      queryClient.invalidateQueries({ queryKey: ['sources'] })
    } catch (error) {
      setSnackbar({
        open: true,
        message: (error as Error).message || 'Failed to add source',
        severity: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSourceClick = useCallback(async (source: any) => {
    if (source.is_active === 1 || settingActive) return
    
    setSettingActive(String(source.id))
    try {
      await api.sources.setActive(source.id)
      setSnackbar({
        open: true,
        message: `"${source.source_name}" is now the active source`,
        severity: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['sources'] })
    } catch (error) {
      setSnackbar({
        open: true,
        message: (error as Error).message || 'Failed to activate source',
        severity: 'error',
      })
    } finally {
      setSettingActive(null)
    }
  }, [queryClient, settingActive])

  const handleDeleteSource = useCallback(async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    setDeleting(String(id))
    try {
      await api.sources.delete(id)
      setSnackbar({
        open: true,
        message: `Source "${name}" deleted successfully`,
        severity: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['sources'] })
    } catch (error) {
      setSnackbar({
        open: true,
        message: (error as Error).message || 'Failed to delete source',
        severity: 'error',
      })
    } finally {
      setDeleting(null)
    }
  }, [queryClient])

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  if (sourcesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    )
  }

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
          <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
            Sources
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            Add Source
          </Button>
        </Box>

        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
          Click on a source to activate it
        </Typography>

        {sources && sources.length > 0 ? (
          <List disablePadding>
            {sources.map((source: any) => {
              const loadedExtensions = source.loaded_extensions 
                ? source.loaded_extensions.split(',') 
                : []
              
              const isActive = source.is_active === 1
              const isSettingActive = settingActive === String(source.id)
              const isDeleting = deleting === String(source.id)
              
              return (
                <ListItem
                  key={source.id}
                  sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: isActive ? `${theme.palette.primary.main}0a` : 'transparent',
                    borderRadius: 1,
                    mb: 1,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    cursor: isActive ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': {
                      bgcolor: isActive ? `${theme.palette.primary.main}0a` : `${theme.palette.primary.main}05`,
                      transform: isActive ? 'none' : 'translateX(4px)',
                    },
                  }}
                  onClick={() => handleSourceClick(source)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <SourceIcon sx={{ 
                      mr: 2, 
                      color: isActive ? theme.palette.primary.main : theme.palette.text.disabled 
                    }} />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                            {source.source_name}
                          </Typography>
                          {isActive && (
                            <Chip
                              label="Active"
                              size="small"
                              sx={{
                                bgcolor: `${theme.palette.primary.main}33`,
                                color: theme.palette.primary.main,
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                          )}
                          <Chip
                            label={`${loadedExtensions.length} extensions`}
                            size="small"
                            sx={{
                              bgcolor: `${theme.palette.success.main}33`,
                              color: theme.palette.success.main,
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          {source.source_link}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      {isSettingActive ? (
                        <CircularProgress size={20} sx={{ color: theme.palette.primary.main, mr: 1 }} />
                      ) : (
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSource(source.id, source.source_name)
                          }}
                          disabled={isDeleting || isActive}
                          sx={{ 
                            color: theme.palette.text.secondary, 
                            '&:hover': { color: theme.palette.error.main },
                            opacity: isActive ? 0.3 : 1,
                          }}
                        >
                          {isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </Box>
                </ListItem>
              )
            })}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              No sources configured
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
              Click "Add Source" to configure one
            </Typography>
          </Box>
        )}
      </Paper>

      <Dialog 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            backdropFilter: 'blur(20px)',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }
        }}
      >
        <DialogTitle sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
          Add Source
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Source Name"
            type="text"
            fullWidth
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newSourceName.trim() && newSourceLink.trim()) {
                handleAddSource()
              }
            }}
            sx={{
              mb: 2,
              '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
              '& .MuioutlinedInput-root': {
                color: theme.palette.text.primary,
                '& fieldset': { borderColor: theme.palette.divider },
                '&:hover fieldset': { borderColor: theme.palette.text.secondary },
                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
              },
            }}
          />
          <TextField
            margin="dense"
            label="Source Link (URL to manifest.json)"
            type="url"
            fullWidth
            value={newSourceLink}
            onChange={(e) => setNewSourceLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newSourceName.trim() && newSourceLink.trim()) {
                handleAddSource()
              }
            }}
            placeholder="https://example.com/extensions/manifest.json"
            sx={{
              '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
              '& .MuioutlinedInput-root': {
                color: theme.palette.text.primary,
                '& fieldset': { borderColor: theme.palette.divider },
                '&:hover fieldset': { borderColor: theme.palette.text.secondary },
                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setOpenAddDialog(false)} 
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': { color: theme.palette.text.primary },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddSource}
            variant="outlined"
            disabled={saving || !newSourceName.trim() || !newSourceLink.trim()}
          >
            {saving ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Add'}
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
  )
}