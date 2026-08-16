import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Typography,
  Divider,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  InputAdornment,
  IconButton,
  Box,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import FilterListIcon from '@mui/icons-material/FilterList'
import AllInclusiveIcon from '@mui/icons-material/AllInclusive'
import { api } from '~/components'

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

type FilterType = 'all' | 'name'

interface SearchResult {
  data: any[]
  success: boolean
  total?: number
  extensionId?: string
  info?: {
    name: string
    version: string
    description: string
    author: string
  }
  isActive?: boolean
  error?: string
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const theme = useTheme()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Record<string, SearchResult>>({})
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [filterType, setFilterType] = useState<FilterType>('all')

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setResults({})
    setHasSearched(true)

    try {
      const data = await api.extension.search(query) as Record<string, SearchResult>
      
      if (filterType === 'name') {
        const filteredData: Record<string, SearchResult> = {}
        const searchLower = query.toLowerCase()
        
        for (const [key, result] of Object.entries(data)) {
          if (result.success && Array.isArray(result.data)) {
            const filteredItems = result.data.filter((item: any) => {
              const title = (item.title || '').toLowerCase()
              const name = (item.name || '').toLowerCase()
              return title.includes(searchLower) || name.includes(searchLower)
            })
            
            if (filteredItems.length > 0) {
              filteredData[key] = {
                ...result,
                data: filteredItems,
                total: filteredItems.length
              }
            }
          }
        }
        setResults(filteredData)
      } else {
        setResults(data)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [query, isLoading, filterType])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  const handleClose = useCallback(() => {
    setQuery('')
    setResults({})
    setIsLoading(false)
    setError(null)
    setHasSearched(false)
    setFilterType('all')
    onClose()
  }, [onClose])

  const handleCardClick = useCallback((extensionId: string, item: any) => {
    const identifier = item.slug || item.id
    if (identifier) {
      navigate(`/details/${extensionId}/${identifier}`)
      handleClose()
    }
  }, [navigate, handleClose])

  const getResultsCount = useCallback(() => {
    let count = 0
    for (const [_, result] of Object.entries(results)) {
      if (result.success && Array.isArray(result.data)) {
        count += result.data.length
      }
    }
    return count
  }, [results])

  const resultItems = useMemo(() => Object.entries(results), [results])

  const showNoResults = hasSearched && !isLoading && Object.keys(results).length === 0 && query && !error

  const handleFilterChange = useCallback((event: React.MouseEvent<HTMLElement>, newFilter: FilterType | null) => {
    if (newFilter !== null) {
      setFilterType(newFilter)
    }
  }, [])

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          height: '90vh', 
          maxHeight: '90vh', 
          bgcolor: theme.palette.background.paper,
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
          },
        },
      }}
    >
      <DialogTitle sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SearchIcon sx={{ color: theme.palette.text.primary }} />
            <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
              Search
            </Typography>
            {isLoading && (
              <Chip
                label="Searching..."
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}33`,
                  color: theme.palette.primary.main,
                  fontSize: '0.7rem',
                }}
              />
            )}
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: theme.palette.text.secondary }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2, overflow: 'auto' }}>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search for books, authors, or topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              size="small"
              autoFocus
              sx={{
                flex: 1,
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  color: theme.palette.text.primary,
                  '& fieldset': { borderColor: theme.palette.divider },
                  '&:hover fieldset': { borderColor: theme.palette.text.secondary },
                  '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                },
                '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={!query.trim() || isLoading}
            >
              {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Search'}
            </Button>
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon sx={{ color: theme.palette.text.secondary, fontSize: '0.9rem' }} />
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Filter:
              </Typography>
            </Box>
            <ToggleButtonGroup
              value={filterType}
              exclusive
              onChange={handleFilterChange}
              size="small"
              aria-label="search filter"
              sx={{
                '& .MuiToggleButton-root': {
                  color: theme.palette.text.secondary,
                  borderColor: theme.palette.divider,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  px: 1.5,
                  py: 0.5,
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    backgroundColor: `${theme.palette.primary.main}1a`,
                    borderColor: theme.palette.primary.main,
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                },
              }}
            >
              <ToggleButton value="all" aria-label="all results">
                <AllInclusiveIcon sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                All
              </ToggleButton>
              <ToggleButton value="name" aria-label="search by name only">
                <SearchIcon sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                By Name
              </ToggleButton>
            </ToggleButtonGroup>
            {filterType === 'name' && hasSearched && (
              <Chip
                label="Filtering by name only"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}33`,
                  color: theme.palette.primary.main,
                  fontSize: '0.6rem',
                  height: 20,
                }}
              />
            )}
          </Box>
        </Box>

        {error && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: `${theme.palette.error.main}0a`,
              mb: 2,
              borderRadius: 1,
            }}
          >
            <Typography color="error" variant="body2">
              Error: {error}
            </Typography>
          </Paper>
        )}

        {Object.keys(results).length > 0 && (
          <Box sx={{ height: 'calc(100% - 140px)', overflow: 'hidden' }}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: theme.palette.text.primary }}>
                Results for "{query}"
                {filterType === 'name' && (
                  <Chip
                    label="Filtered by name"
                    size="small"
                    sx={{
                      ml: 1,
                      bgcolor: `${theme.palette.primary.main}33`,
                      color: theme.palette.primary.main,
                      fontSize: '0.6rem',
                      height: 18,
                    }}
                  />
                )}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Found {getResultsCount()} result(s)
              </Typography>
              <Divider sx={{ my: 1, borderColor: theme.palette.divider }} />
            </Box>

            <Box
              sx={{
                height: 'calc(100% - 50px)',
                overflowY: 'auto',
                overflowX: 'hidden',
                pr: 0.5,
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '2px',
                },
              }}
            >
              {resultItems.map(([extensionName, result]: [string, SearchResult]) => {
                const extensionId = result.extensionId || extensionName
                return (
                  <Box key={extensionName} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption" fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                        {result.info?.name || extensionName}
                      </Typography>
                    </Box>

                    {result.success ? (
                      <>
                        {Array.isArray(result.data) && result.data.length > 0 ? (
                          <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
                            {result.data.map((item: any, index: number) => (
                              <Card
                                key={index}
                                sx={{
                                  minWidth: 130,
                                  maxWidth: 130,
                                  flexShrink: 0,
                                  cursor: 'pointer',
                                  bgcolor: theme.palette.background.paper,
                                  '&:hover': {
                                    transform: 'scale(1.03)',
                                    transition: 'transform 0.15s ease',
                                    boxShadow: 4,
                                  },
                                }}
                                onClick={() => handleCardClick(extensionId, item)}
                              >
                                <CardActionArea>
                                  {item.cover ? (
                                    <CardMedia
                                      component="img"
                                      height="180"
                                      image={item.cover}
                                      alt={item.title || 'Untitled'}
                                      sx={{ objectFit: 'cover' }}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <Box
                                      sx={{
                                        height: 180,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: theme.palette.action.hover,
                                      }}
                                    >
                                      <Typography variant="caption" color={theme.palette.text.disabled}>
                                        No Cover
                                      </Typography>
                                    </Box>
                                  )}
                                  <CardContent sx={{ p: 1 }}>
                                    <Typography variant="caption" noWrap fontWeight="medium" display="block" sx={{ color: theme.palette.text.primary }}>
                                      {item.title || 'Untitled'}
                                    </Typography>
                                    {item.author && (
                                      <Typography variant="caption" noWrap display="block" sx={{ color: theme.palette.text.secondary }}>
                                        {item.author}
                                      </Typography>
                                    )}
                                  </CardContent>
                                </CardActionArea>
                              </Card>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, py: 1 }}>
                            No results found
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="caption" color="error">
                        Error: {result.error}
                      </Typography>
                    )}
                    <Divider sx={{ mt: 1.5, borderColor: theme.palette.divider }} />
                  </Box>
                )
              })}
            </Box>
          </Box>
        )}

        {showNoResults && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              No results found for "{query}"
            </Typography>
          </Box>
        )}

        {!hasSearched && !isLoading && !query && !error && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              Enter a search term to begin
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}