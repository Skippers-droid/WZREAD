import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '~/components'
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Button,
  useTheme,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CircleIcon from '@mui/icons-material/Circle'
import ExtensionIcon from '@mui/icons-material/Extension'

export function SourcesTab() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [sources, setSources] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSources = async () => {
    try {
      setIsLoading(true)
      const data = await api.sources.getAll()
      setSources(data)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSources()
  }, [])

  const getActiveExtensions = (source: any) => {
    if (!source.loaded_extension_ids || !source.loaded_extensions_active) {
      return []
    }
    const ids = source.loaded_extension_ids.split(',')
    const activeStatus = source.loaded_extensions_active.split(',').map((s: string) => parseInt(s))
    return ids.filter((_: string, index: number) => activeStatus[index] === 1)
  }

  const getExtensionName = (source: any, extensionId: string) => {
    if (!source.loaded_extensions) return extensionId
    const names = source.loaded_extensions.split(',')
    const ids = source.loaded_extension_ids?.split(',') || []
    const index = ids.indexOf(extensionId)
    return index !== -1 ? names[index] : extensionId
  }

  const handleExtensionClick = (extensionId: string) => {
    navigate(`/extension/${extensionId}`)
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2, bgcolor: theme.palette.background.paper }}>
        Failed to load sources: {error}
      </Alert>
    )
  }

  if (!sources || sources.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
          No sources configured
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.disabled, mb: 2 }}>
          Add a source in Settings to get started
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/settings')}
          sx={{
            bgcolor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark },
            textTransform: 'none',
          }}
        >
          Go to Settings
        </Button>
      </Box>
    )
  }

  const hasActiveExtensions = sources.some((source: any) => {
    const activeExtensions = getActiveExtensions(source)
    return activeExtensions.length > 0
  })

  if (!hasActiveExtensions) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
          No active extensions found
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
          Activate extensions in the Extensions tab
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {sources.map((source: any) => {
        const activeExtensionIds = getActiveExtensions(source)
        const isActive = source.is_active === true
        
        if (activeExtensionIds.length === 0) {
          return null
        }
        
        return (
          <Paper
            key={source.id}
            elevation={0}
            sx={{
              mb: 3,
              bgcolor: isActive ? `${theme.palette.primary.main}0a` : theme.palette.background.paper,
              borderRadius: 2,
              border: `1px solid ${isActive ? `${theme.palette.primary.main}33` : theme.palette.divider}`,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${isActive ? `${theme.palette.primary.main}33` : theme.palette.divider}`,
                bgcolor: isActive ? `${theme.palette.primary.main}0a` : 'transparent',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isActive ? (
                  <CheckCircleIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                ) : (
                  <CircleIcon sx={{ color: theme.palette.text.disabled, fontSize: 16 }} />
                )}
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                  {source.source_name}
                </Typography>
                {isActive && (
                  <Chip
                    label="Active Source"
                    size="small"
                    sx={{
                      bgcolor: `${theme.palette.primary.main}33`,
                      color: theme.palette.primary.main,
                      fontSize: '0.65rem',
                      height: 20,
                    }}
                  />
                )}
                <Chip
                  label={`${activeExtensionIds.length} active`}
                  size="small"
                  sx={{
                    bgcolor: `${theme.palette.primary.main}33`,
                    color: theme.palette.primary.main,
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {activeExtensionIds.map((extensionId: string) => {
                  const extensionName = getExtensionName(source, extensionId)
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={extensionId}>
                      <Card
                        sx={{
                          bgcolor: theme.palette.background.paper,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.customShadows?.lg || '0 8px 24px rgba(0,0,0,0.3)',
                            borderColor: `${theme.palette.primary.main}66`,
                            bgcolor: `${theme.palette.primary.main}0a`,
                          },
                        }}
                        onClick={() => handleExtensionClick(extensionId)}
                      >
                        <CardActionArea sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ExtensionIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                            <Box>
                              <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                                {extensionName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                Active
                              </Typography>
                            </Box>
                          </Box>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </Box>
          </Paper>
        )
      })}
    </Box>
  )
}