// src/pages/history.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Container,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Paper,
  useTheme,
  Button,
  Alert,
  Divider,
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

  const decodeHtmlEntities = (text: string): string => {
    if (!text) return text;
    
    const entities: { [key: string]: string } = {
      '&#8217;': "'",
      '&#8216;': "'",
      '&#8220;': '"',
      '&#8221;': '"',
      '&#8230;': '...',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&apos;': "'",
      '&#39;': "'",
      '&#34;': '"',
      '&#38;': '&',
      '&#60;': '<',
      '&#62;': '>',
      '&#160;': ' ',
    };
    
    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }
    
    return decoded;
  };

  const truncateText = (text: string, limit: number = 60): string => {
    if (!text) return '';
    const decoded = decodeHtmlEntities(text);
    if (decoded.length <= limit) return decoded;
    return decoded.slice(0, limit) + '...';
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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
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
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'transparent',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <List disablePadding>
              {historyItems.map((item, index) => (
                <Box key={`${item.extension_id}-${item.book_id}-${item.chapter_number}-${index}`}>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      mb: 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: theme.customShadows?.sm || '0 2px 8px rgba(0,0,0,0.08)',
                      },
                    }}
                  >
                    <ListItem
                      disablePadding
                      secondaryAction={
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
                            fontSize: '0.7rem',
                            py: 0.5,
                            px: 1.5,
                            mr: 1,
                          }}
                        >
                          Continue
                        </Button>
                      }
                    >
                      <ListItemButton
                        onClick={() => handleGoToDetails(item)}
                        sx={{
                          py: 1.5,
                          px: 2,
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: theme.palette.action.hover,
                            borderRadius: 2,
                          },
                        }}
                      >
                        <ListItemAvatar>
                          {item.cover ? (
                            <Avatar
                              src={item.cover}
                              alt={item.comic_title}
                              variant="rounded"
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 1,
                                mr: 2,
                              }}
                            />
                          ) : (
                            <Avatar
                              variant="rounded"
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 1,
                                mr: 2,
                                bgcolor: `${theme.palette.primary.main}1a`,
                                color: theme.palette.primary.main,
                              }}
                            >
                              {item.comic_title.charAt(0)}
                            </Avatar>
                          )}
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body1"
                              sx={{
                                color: theme.palette.text.primary,
                                fontWeight: 500,
                              }}
                            >
                              {item.comic_title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                              {item.title && (
                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                  {truncateText(item.title, 60)}
                                </Typography>
                              )}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip
                                  label={`Page ${item.page_number}`}
                                  size="small"
                                  sx={{
                                    bgcolor: `${theme.palette.primary.main}33`,
                                    color: theme.palette.primary.main,
                                    fontSize: '0.6rem',
                                    height: 18,
                                  }}
                                />
                                <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                                  {formatDate(item.read_at)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  </Paper>
                </Box>
              ))}
            </List>
          </Paper>
        )}
      </Container>
    </Box>
  );
}