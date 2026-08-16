import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Container,
  Typography,
  CircularProgress,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  IconButton,
  Paper,
  useTheme,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useExtensionContent } from '~/components';
import { PyrenzCard, FilterDialog } from '~/components';

export function ExtensionPage() {
  const theme = useTheme();
  const { extensionId } = useParams<{ extensionId: string }>();
  const navigate = useNavigate();
  
  const {
    items,
    isLoading,
    sourceLoading,
    extensionInfo,
    viewMode,
    filterDialogOpen,
    filterParams,
    handleViewChange,
    handleFilterApply,
    handleFilterReset,
    updateFilterParams,
    setFilterDialogOpen,
    loadMore,
    hasMore,
    total,
  } = useExtensionContent({ extensionId });

  const handleBack = () => {
    navigate('/browse');
  };

  const handleItemClick = (item: any) => {
    if (extensionId && item.slug) {
      navigate(`/details/${extensionId}/${item.slug}`);
    }
  };

  if (sourceLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (!extensionInfo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
        <Typography variant="h5" color={theme.palette.text.secondary}>
          Extension not found: {extensionId}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <CssBaseline />
      
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <IconButton 
          onClick={handleBack} 
          sx={{ 
            color: theme.palette.text.primary,
            mb: 3,
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            bgcolor: theme.palette.background.paper,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            gap: 4,
            alignItems: 'flex-start',
          }}
        >
          {extensionInfo.cover ? (
            <Box
              component="img"
              src={extensionInfo.cover}
              alt={extensionInfo.name}
              sx={{
                width: 120,
                height: 120,
                borderRadius: 2,
                objectFit: 'cover',
                flexShrink: 0,
                border: `1px solid ${theme.palette.divider}`,
              }}
            />
          ) : (
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: 2,
                bgcolor: `${theme.palette.primary.main}1a`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="h2" sx={{ color: `${theme.palette.primary.main}80` }}>
                {extensionInfo.name.charAt(0).toUpperCase()}
              </Typography>
            </Box>
          )}

          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', mb: 1 }}>
              {extensionInfo.name}
            </Typography>
            {extensionInfo.description && (
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                {extensionInfo.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`v${extensionInfo.version || '1.0.0'}`}
                size="small"
                sx={{
                  bgcolor: theme.palette.action.hover,
                  color: theme.palette.text.secondary,
                }}
              />
              {extensionInfo.author && (
                <Chip
                  label={`by ${extensionInfo.author}`}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.action.hover,
                    color: theme.palette.text.secondary,
                  }}
                />
              )}
              {extensionInfo.isActive && (
                <Chip
                  label="Active"
                  size="small"
                  sx={{
                    bgcolor: `${theme.palette.primary.main}33`,
                    color: theme.palette.primary.main,
                  }}
                />
              )}
            </Box>
          </Box>
        </Paper>

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(event, newMode) => {
              if (newMode !== null) {
                handleViewChange(newMode);
              }
            }}
            aria-label="view mode"
          >
            <ToggleButton value="popular" aria-label="popular">
              <WhatshotIcon sx={{ mr: 1 }} />
              Popular
            </ToggleButton>
            <ToggleButton value="latest" aria-label="latest">
              <NewReleasesIcon sx={{ mr: 1 }} />
              Latest
            </ToggleButton>
            <ToggleButton value="filtered" aria-label="filter">
              <FilterListIcon sx={{ mr: 1 }} />
              Filter
            </ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
            {isLoading ? 'Loading...' : `${items.length} of ${total} items`}
          </Typography>
        </Box>

        {isLoading && items.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress sx={{ color: theme.palette.primary.main }} />
          </Box>
        ) : items.length > 0 ? (
          <>
            <Grid container spacing={3}>
              {items.map((item: any, index: number) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={`${item.id || item.slug}-${index}`}>
                  <PyrenzCard
                    sx={{
                      p: 0,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        borderColor: theme.palette.primary.main,
                        boxShadow: theme.customShadows?.lg || '0 8px 32px rgba(0,0,0,0.3)',
                      },
                    }}
                    onClick={() => handleItemClick(item)}
                  >
                    {item.cover ? (
                      <Box
                        component="img"
                        src={item.cover}
                        alt={item.title || 'Untitled'}
                        sx={{
                          width: '100%',
                          height: 280,
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 280,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <Typography variant="caption" color={theme.palette.text.disabled}>
                          No Cover
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ p: 1.5 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          color: theme.palette.text.primary,
                          fontWeight: 'medium',
                          fontSize: '0.9rem',
                        }}
                      >
                        {item.title || 'Untitled'}
                      </Typography>
                      {item.author && (
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{
                            color: theme.palette.text.secondary,
                            display: 'block',
                            mt: 0.5,
                          }}
                        >
                          {item.author}
                        </Typography>
                      )}
                      {item.status && (
                        <Chip
                          label={item.status}
                          size="small"
                          sx={{
                            mt: 1,
                            height: 20,
                            fontSize: '0.6rem',
                            bgcolor: item.status === 'Ongoing' || item.status === 'ONGOING' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                            color: item.status === 'Ongoing' || item.status === 'ONGOING' ? '#4caf50' : '#ff9800',
                          }}
                        />
                      )}
                    </Box>
                  </PyrenzCard>
                </Grid>
              ))}
            </Grid>
            
            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                  variant="contained"
                  onClick={loadMore}
                  disabled={isLoading}
                  sx={{
                    textTransform: 'none',
                    px: 4,
                    py: 1,
                  }}
                >
                  {isLoading ? <CircularProgress size={24} sx={{ color: theme.palette.primary.contrastText }} /> : 'Load More'}
                </Button>
              </Box>
            )}
          </>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
              border: `1px dashed ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
              No items found
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
              Try switching to a different view mode
            </Typography>
          </Paper>
        )}
      </Container>

      <FilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filterParams={filterParams}
        onFilterChange={updateFilterParams}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
      />
    </Box>
  );
}