import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Container,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Chip,
  Paper,
  useTheme,
  Button,
  Alert,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HistoryIcon from '@mui/icons-material/History';
import { api } from '~/components';
import { useQuery } from '@tanstack/react-query';

interface HistoryItem {
  extension_id: string;
  book_id: string;
  chapter_number: number;
  chapter_slug: string;
  title: string;
  page_number: number;
  read_at: string;
  comic_title: string;
  cover: string;
}

export function History() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: comics, isLoading: comicsLoading } = useQuery({
    queryKey: ['comics'],
    queryFn: () => api.comics.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setError(null);
        
        const allHistory = await api.history.getAll();
        
        const formattedHistory: HistoryItem[] = allHistory.map((item: any) => {
          const comic = comics?.find((c: any) => c.extension_id === item.extension_id && c.book_id === item.book_id);
          
          let lastRead = null;
          if (item.last_read) {
            lastRead = item.last_read;
          } else if (item.history) {
            const entries = Object.values(item.history);
            if (entries.length > 0) {
              lastRead = entries[0];
            }
          }
          
          if (!lastRead) return null;
          
          return {
            extension_id: item.extension_id,
            book_id: item.book_id,
            chapter_number: lastRead.chapter_number,
            chapter_slug: lastRead.chapter_slug,
            title: lastRead.title || `Chapter ${lastRead.chapter_number}`,
            page_number: lastRead.page_number || 1,
            read_at: lastRead.read_at || item.updated_at || new Date().toISOString(),
            comic_title: comic?.title || 'Unknown Comic',
            cover: comic?.cover || '',
          };
        }).filter(Boolean) as HistoryItem[];

        formattedHistory.sort((a, b) => 
          new Date(b.read_at).getTime() - new Date(a.read_at).getTime()
        );

        setHistoryItems(formattedHistory);
      } catch (err) {
        console.error('Failed to load history:', err);
        setError('Failed to load reading history');
      } finally {
        setIsLoading(false);
      }
    };

    if (!comicsLoading) {
      loadHistory();
    }
  }, [comics, comicsLoading]);

  const handleContinueReading = (item: HistoryItem) => {
    navigate(`/chapter/${item.extension_id}/${item.book_id}/${item.chapter_number}`);
  };

  const handleGoToDetails = (item: HistoryItem) => {
    navigate(`/details/${item.extension_id}/${item.book_id}`);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      const diffWeek = Math.floor(diffDay / 7);
      const diffMonth = Math.floor(diffDay / 30);
      const diffYear = Math.floor(diffDay / 365);

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay < 7) return `${diffDay}d ago`;
      if (diffWeek < 4) return `${diffWeek}w ago`;
      if (diffMonth < 12) return `${diffMonth}mo ago`;
      return `${diffYear}y ago`;
    } catch {
      return 'Recently';
    }
  };

  const isLoadingState = isLoading || comicsLoading;

  if (isLoadingState) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', bgcolor: theme.palette.background.default }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <HistoryIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
          <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
            Reading History
          </Typography>
          <Chip
            label={`${historyItems.length} items`}
            size="small"
            sx={{
              bgcolor: `${theme.palette.primary.main}33`,
              color: theme.palette.primary.main,
            }}
          />
        </Box>

        {historyItems.length === 0 ? (
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
            <HistoryIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
            <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
              No reading history yet
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
              Start reading a comic to track your progress here
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/browse')}
              sx={{ mt: 2 }}
            >
              Browse Comics
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {historyItems.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={`${item.extension_id}-${item.book_id}-${item.chapter_number}-${index}`}>
                <Card
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.2s ease',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.customShadows?.lg || '0 8px 24px rgba(0,0,0,0.3)',
                      borderColor: `${theme.palette.primary.main}66`,
                    },
                  }}
                >
                  <CardActionArea onClick={() => handleGoToDetails(item)}>
                    <Box sx={{ position: 'relative' }}>
                      {item.cover ? (
                        <CardMedia
                          component="img"
                          image={item.cover}
                          alt={item.comic_title}
                          sx={{
                            height: 200,
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: 200,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: `${theme.palette.primary.main}1a`,
                          }}
                        >
                          <Typography variant="h2" sx={{ color: `${theme.palette.primary.main}80` }}>
                            {item.comic_title.charAt(0)}
                          </Typography>
                        </Box>
                      )}
                      <Chip
                        label={formatDate(item.read_at)}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          backdropFilter: 'blur(10px)',
                          color: 'white',
                          fontSize: '0.6rem',
                          height: 20,
                        }}
                      />
                    </Box>
                    <CardContent>
                      <Typography
                        variant="h6"
                        noWrap
                        sx={{
                          color: theme.palette.text.primary,
                          fontWeight: 'bold',
                          fontSize: '1rem',
                        }}
                      >
                        {item.comic_title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          mt: 0.5,
                        }}
                      >
                        Chapter {item.chapter_number}
                        {item.title && ` - ${item.title}`}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Chip
                          label={`Page ${item.page_number}`}
                          size="small"
                          sx={{
                            bgcolor: `${theme.palette.primary.main}33`,
                            color: theme.palette.primary.main,
                            fontSize: '0.6rem',
                            height: 20,
                          }}
                        />
                        <Box sx={{ flex: 1 }} />
                        <Button
                          size="small"
                          variant="contained"
                          endIcon={<ArrowForwardIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContinueReading(item);
                          }}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            py: 0.5,
                          }}
                        >
                          Continue
                        </Button>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}