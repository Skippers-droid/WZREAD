import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, getActiveExtensionIds, useExtensionDownload } from '~/components'
import {
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Box,
  Avatar,
  Button,
  Snackbar,
  Alert,
  LinearProgress,
  useTheme,
} from '@mui/material'
import ExtensionIcon from '@mui/icons-material/Extension'
import DownloadIcon from '@mui/icons-material/Download'

interface ManifestExtension {
  name: string
  id: string
  version: string
  description: string
  author: string
  cover: string | null
  isActive: boolean
  isLoaded: boolean
}

export function ExtensionsTab() {
  const theme = useTheme()
  const queryClient = useQueryClient()
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })
  const [activating, setActivating] = useState<string | null>(null)
  const { downloadExtension, isDownloading, progress, message, error, completed, reset } = useExtensionDownload()
  const [downloadingExtId, setDownloadingExtId] = useState<string | null>(null)

  const { data: sourceData, isLoading: sourcesLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: () => api.sources.getAll(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: extData, isLoading: extensionsLoading, refetch: refetchExtensions } = useQuery({
    queryKey: ['extensions'],
    queryFn: () => api.sources.getExtensions(),
    staleTime: 5 * 60 * 1000,
  })

  const isLoading = sourcesLoading || extensionsLoading

  const source = sourceData?.find((s: any) => s.is_active === true)

  const manifestExtensions: ManifestExtension[] = extData?.success && extData.extensions && source
    ? extData.extensions.map((ext: any) => ({
        ...ext,
        isActive: getActiveExtensionIds(source).includes(ext.id),
      }))
    : extData?.success && extData.extensions
    ? extData.extensions.map((ext: any) => ({
        ...ext,
        isActive: false,
      }))
    : []

  const activeCount = manifestExtensions.filter(ext => ext.isActive).length

  const handleActivateExtension = async (id: string, name: string) => {
    if (activating) return
    
    setActivating(id)
    try {
      await api.sources.setActiveExtension(id, true)
      setSnackbar({
        open: true,
        message: `"${name}" has been activated`,
        severity: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      queryClient.invalidateQueries({ queryKey: ['extensions'] })
    } catch (error) {
      setSnackbar({
        open: true,
        message: (error as Error).message || 'Failed to activate extension',
        severity: 'error',
      })
    } finally {
      setActivating(null)
    }
  }

  const handleDeactivateExtension = async (id: string, name: string) => {
    if (activating) return
    
    setActivating(id)
    try {
      await api.sources.setActiveExtension(id, false)
      setSnackbar({
        open: true,
        message: `"${name}" has been deactivated`,
        severity: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      queryClient.invalidateQueries({ queryKey: ['extensions'] })
    } catch (error) {
      setSnackbar({
        open: true,
        message: (error as Error).message || 'Failed to deactivate extension',
        severity: 'error',
      })
    } finally {
      setActivating(null)
    }
  }

  const handleDownloadExtension = async (id: string, name: string) => {
    setDownloadingExtId(id)
    reset()
    try {
      await downloadExtension(id)
      if (completed) {
        setSnackbar({
          open: true,
          message: `"${name}" has been downloaded and activated`,
          severity: 'success',
        })
        await refetchExtensions()
        queryClient.invalidateQueries({ queryKey: ['sources'] })
        queryClient.invalidateQueries({ queryKey: ['extensions'] })
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: (error as Error).message || 'Failed to download extension',
        severity: 'error',
      })
    } finally {
      setDownloadingExtId(null)
    }
  }

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  if (isLoading) {
    return (
      <Grid container justifyContent="center" alignItems="center" sx={{ height: 400 }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Grid>
    )
  }

  if (!source) {
    return (
      <Grid container justifyContent="center" sx={{ p: 4 }}>
        <Grid item xs={12} sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
            No Active Source Configured
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.disabled, mb: 2 }}>
            You need to add and activate a source to view extensions.
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              window.location.hash = '/settings'
            }}
          >
            Go to Settings
          </Button>
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>
                Source: <span style={{ color: theme.palette.text.primary }}>{source.source_name}</span>
              </Typography>
              <Chip
                label={activeCount > 0 ? `${activeCount} active` : 'None active'}
                size="small"
                sx={{
                  bgcolor: activeCount > 0 ? `${theme.palette.primary.main}33` : theme.palette.action.hover,
                  color: activeCount > 0 ? theme.palette.primary.main : theme.palette.text.disabled,
                  fontSize: '0.65rem',
                  height: 24,
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
              {manifestExtensions.length > 0 ? `${manifestExtensions.length} extensions available` : 'No extensions available'}
            </Typography>
          </Box>

          {isDownloading && downloadingExtId && (
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                    {message}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      mt: 1,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: theme.palette.action.hover,
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 2,
                        bgcolor: theme.palette.primary.main,
                      },
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, minWidth: 40 }}>
                  {progress}%
                </Typography>
              </Box>
              {error && (
                <Typography variant="caption" sx={{ color: theme.palette.error.main, mt: 1, display: 'block' }}>
                  Error: {error}
                </Typography>
              )}
            </Box>
          )}

          {manifestExtensions.length > 0 ? (
            <List disablePadding>
              {manifestExtensions.map((ext: any) => {
                const isActivating = activating === ext.id
                const isDownloadingThis = downloadingExtId === ext.id && isDownloading
                const isActive = ext.isActive
                const isInstalled = ext.isLoaded
                
                return (
                  <ListItem
                    key={ext.id || ext.name}
                    sx={{
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      '&:last-child': { borderBottom: 'none' },
                      py: 2,
                      bgcolor: isActive ? `${theme.palette.primary.main}0a` : 'transparent',
                    }}
                  >
                    {ext.cover ? (
                      <Avatar
                        src={ext.cover}
                        alt={ext.name}
                        sx={{
                          mr: 2,
                          width: 48,
                          height: 48,
                          borderRadius: 1,
                          bgcolor: theme.palette.action.hover,
                        }}
                        variant="rounded"
                      />
                    ) : (
                      <ExtensionIcon sx={{ mr: 2, color: theme.palette.text.secondary, fontSize: 40 }} />
                    )}
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                            {ext.name}
                          </Typography>
                          {isActive && (
                            <Chip
                              label="Active"
                              size="small"
                              sx={{
                                bgcolor: `${theme.palette.primary.main}33`,
                                color: theme.palette.primary.main,
                                fontSize: '0.65rem',
                                height: 20,
                              }}
                            />
                          )}
                          {isInstalled && !isActive && (
                            <Chip
                              label="Installed"
                              size="small"
                              sx={{
                                bgcolor: `${theme.palette.success.main}33`,
                                color: theme.palette.success.main,
                                fontSize: '0.65rem',
                                height: 20,
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box component="span">
                          <Typography variant="body2" component="span" sx={{ color: theme.palette.text.secondary }}>
                            v{ext.version}
                          </Typography>
                          {ext.author && (
                            <Typography variant="caption" component="span" sx={{ color: theme.palette.text.disabled, display: 'block' }}>
                              by {ext.author}
                            </Typography>
                          )}
                          {ext.description && (
                            <Typography variant="caption" component="span" sx={{ color: theme.palette.text.disabled, display: 'block', mt: 0.5 }}>
                              {ext.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <Box sx={{ ml: 2, display: 'flex', gap: 1 }}>
                      {isDownloadingThis ? (
                        <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
                      ) : isActive ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDeactivateExtension(ext.id, ext.name)}
                          disabled={!!activating}
                        >
                          Deactivate
                        </Button>
                      ) : isInstalled ? (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleActivateExtension(ext.id, ext.name)}
                          disabled={!!activating}
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadExtension(ext.id, ext.name)}
                          disabled={isDownloading}
                        >
                          Install
                        </Button>
                      )}
                    </Box>
                  </ListItem>
                )
              })}
            </List>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                No extensions found
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled, mt: 1, display: 'block' }}>
                The source manifest is empty or inaccessible
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>

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
    </Grid>
  )
}