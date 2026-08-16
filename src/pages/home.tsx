import { Box, Toolbar, Typography, CssBaseline, Button, Paper, Container, Grid, CardMedia, CardActionArea, CircularProgress, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PyrenzCard } from '~/components';
import { useState, useEffect } from 'react';
import { api } from '~/components';

export function Home() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [comics, setComics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadComics = async () => {
      try {
        const data = await api.comics.getAll();
        setComics(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    loadComics();
  }, []);

  const handleComicClick = (comic: any) => {
    navigate(`/details/${comic.extension_id}/${comic.book_id}`);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
        <Typography color="error">Error loading comics: {error.message}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <CssBaseline />
        
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', mb: 1 }}>
              My Library
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {comics?.length || 0} comics in your library
            </Typography>
          </Box>

          {comics && comics.length > 0 ? (
            <Grid container spacing={3}>
              {comics.map((comic: any) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={comic.id}>
                  <PyrenzCard
                    sx={{
                      p: 0,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: theme.customShadows?.lg || '0 8px 32px rgba(0,0,0,0.4)',
                      }
                    }}
                    onClick={() => handleComicClick(comic)}
                  >
                    <CardActionArea sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%' }}>
                      {comic.cover ? (
                        <CardMedia
                          component="img"
                          image={comic.cover}
                          alt={comic.title}
                          sx={{
                            width: '100%',
                            aspectRatio: '2/3',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            aspectRatio: '2/3',
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
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          p: 1.5,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          noWrap 
                          sx={{ 
                            color: '#ffffff', 
                            fontWeight: 'medium',
                            fontSize: '0.9rem',
                            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                          }}
                        >
                          {comic.title}
                        </Typography>
                      </Box>
                    </CardActionArea>
                  </PyrenzCard>
                </Grid>
              ))}
            </Grid>
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
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                Your library is empty
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
                Browse extensions and add comics to your library
              </Typography>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => navigate('/browse')}
                sx={{ mt: 2 }}
              >
                Browse Comics
              </Button>
            </Paper>
          )}
        </Container>
      </Box>
    </Box>
  );
}