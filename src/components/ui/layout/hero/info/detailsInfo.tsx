import { Box, Typography, Chip, Paper, Grid, Button, List, ListItem, ListItemText, ListItemButton, CircularProgress, useTheme, Snackbar, Alert } from '@mui/material';
import { useState } from 'react';
import { api, ChapterContextMenu } from '~/components';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

interface DetailsInfoProps {
  title: string;
  altTitle?: string;
  author?: string;
  status?: string;
  genres?: string[];
  description?: string;
  cover?: string;
  chapters?: any[];
  extensionId?: string;
  bookId?: string;
  comicId?: number;
  sourceLink?: string;
  onChapterClick?: (chapter: any) => void;
  onAddToLibrary?: () => void;
  onRemoveFromLibrary?: () => void;
  onChapterReadToggle?: (chapter: any) => void;
  isSaving?: boolean;
  isInLibrary?: boolean;
}

function formatTimeAgo(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffYear > 0) {
      return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
    } else if (diffMonth > 0) {
      return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
    } else if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  } catch {
    return '';
  }
}

export function DetailsInfo({ 
  title, 
  altTitle, 
  genres, 
  description, 
  cover, 
  chapters = [], 
  extensionId,
  bookId,
  comicId,
  sourceLink,
  onChapterClick,
  onAddToLibrary,
  onRemoveFromLibrary,
  onChapterReadToggle,
  isSaving = false,
  isInLibrary = false,
}: DetailsInfoProps) {
  const theme = useTheme();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    chapter: any;
    chapterId: string;
    isRead: boolean;
  } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [downloading, setDownloading] = useState<string | null>(null);

  const sortedChapters = [...chapters].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    
    if (sortOrder === 'newest') {
      return dateB - dateA || (b.number || 0) - (a.number || 0);
    } else {
      return dateA - dateB || (a.number || 0) - (b.number || 0);
    }
  });

  const toggleSort = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const truncatedDescription = description && description.length > 300 
    ? description.slice(0, 300) + '...' 
    : description;

  const getFirstChapter = () => {
    if (!chapters || chapters.length === 0) return null;
    return chapters.sort((a, b) => (a.number || 0) - (b.number || 0))[0];
  };

  const handleReadFirst = () => {
    const firstChapter = getFirstChapter();
    if (firstChapter && onChapterClick) {
      onChapterClick(firstChapter);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, chapter: any) => {
    event.preventDefault();
    const chapterId = String(chapter.id || chapter.number);
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      chapter,
      chapterId,
      isRead: chapter.read || false,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleToggleRead = async () => {
    if (!contextMenu) return;
    const { chapter } = contextMenu;
    if (onChapterReadToggle) {
      onChapterReadToggle(chapter);
    }
    handleCloseContextMenu();
  };

  const handleDownloadChapter = async () => {
    if (!contextMenu || !extensionId || !bookId || !comicId || !sourceLink) {
      setSnackbar({
        open: true,
        message: 'Cannot download: missing information',
        severity: 'error',
      });
      return;
    }

    const { chapter } = contextMenu;
    const chapterNumber = chapter.number || chapter.id;
    const chapterSlug = chapter.slug || `${chapterNumber}`;
    const chapterTitle = chapter.title || `Chapter ${chapterNumber}`;

    setDownloading(chapter.id || chapterNumber);

    try {
      const result = await api.chapters.download({
        extension_id: extensionId,
        source_link: sourceLink,
        book_id: bookId,
        chapter_number: chapterNumber,
        chapter_slug: chapterSlug,
        chapter_title: chapterTitle,
        comic_title: title,
        comic_id: comicId,
      });

      setSnackbar({
        open: true,
        message: result.already_downloaded 
          ? `"${result.title}" already downloaded`
          : `Downloaded "${result.title}" (${result.page_count || 0} pages)`,
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Download error:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to download chapter',
        severity: 'error',
      });
    } finally {
      setDownloading(null);
      handleCloseContextMenu();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleLongPress = (chapter: any) => {
    const chapterId = String(chapter.id || chapter.number);
    setContextMenu({
      mouseX: window.innerWidth / 2 - 100,
      mouseY: window.innerHeight / 2 - 50,
      chapter,
      chapterId,
      isRead: chapter.read || false,
    });
  };

  const handleTouchStart = (chapter: any) => {
    const timer = window.setTimeout(() => handleLongPress(chapter), 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer !== null) {
      window.clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const isChapterDownloading = (chapter: any) => {
    const id = chapter.id || chapter.number;
    return downloading === id || downloading === String(id);
  };

  return (
    <>
      <Grid container spacing={4} alignItems="flex-start">
        <Grid item xs={12} sm={4} md={3}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            {cover ? (
              <Box
                component="img"
                src={cover}
                alt={title}
                sx={{
                  width: '100%',
                  height: 'auto',
                  aspectRatio: '2/3',
                  objectFit: 'cover',
                  borderRadius: 2,
                  boxShadow: theme.customShadows?.lg || '0 8px 32px rgba(0, 0, 0, 0.6)',
                  mb: 2,
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
                  bgcolor: theme.palette.action.hover,
                  borderRadius: 2,
                  border: `1px dashed ${theme.palette.divider}`,
                  mb: 2,
                }}
              >
                <Typography variant="body1" color={theme.palette.text.disabled}>
                  No Cover Available
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={handleReadFirst}
                disabled={!chapters || chapters.length === 0}
                sx={{
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  flex: 1,
                }}
              >
                Read First
              </Button>

              {isInLibrary ? (
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<BookmarkIcon />}
                  onClick={onRemoveFromLibrary}
                  sx={{
                    py: 1.2,
                    borderRadius: 2,
                    fontWeight: 'medium',
                    fontSize: '0.95rem',
                    flex: 1,
                  }}
                >
                  Remove
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  startIcon={
                    isSaving ? 
                      <CircularProgress size={20} color="inherit" /> : 
                      <BookmarkBorderIcon />
                  }
                  onClick={onAddToLibrary}
                  disabled={isSaving}
                  sx={{
                    py: 1.2,
                    borderRadius: 2,
                    fontWeight: 'medium',
                    fontSize: '0.95rem',
                    flex: 1,
                  }}
                >
                  {isSaving ? 'Saving...' : 'Add to Library'}
                </Button>
              )}
            </Box>

            {isInLibrary && (
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  textAlign: 'center', 
                  color: theme.palette.success.main,
                  mt: 1,
                  fontSize: '0.7rem',
                }}
              >
                ✓ In your library
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} sm={8} md={9}>
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  color: theme.palette.text.primary, 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                }}
              >
                {title}
              </Typography>
              {isInLibrary && (
                <Chip
                  label="In Library"
                  size="small"
                  sx={{
                    bgcolor: `${theme.palette.success.main}33`,
                    color: theme.palette.success.main,
                    fontSize: '0.7rem',
                    height: 24,
                    fontWeight: 'medium',
                  }}
                />
              )}
            </Box>

            {altTitle && (
              <Typography 
                variant="body1" 
                sx={{ 
                  color: theme.palette.text.secondary, 
                  mb: 2,
                  fontStyle: 'italic',
                }}
              >
                {altTitle}
              </Typography>
            )}
          </Box>

          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="overline" 
                sx={{ 
                  color: theme.palette.text.secondary, 
                  letterSpacing: 2,
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  mb: 1,
                  display: 'block',
                }}
              >
                SYNOPSIS
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  color: theme.palette.text.primary, 
                  lineHeight: 1.8,
                  fontSize: '0.95rem',
                }}
              >
                {showFullDescription ? description : truncatedDescription}
              </Typography>
              
              {description && description.length > 300 && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.primary.main, 
                    mt: 1,
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                  onClick={toggleDescription}
                >
                  {showFullDescription ? 'See less' : 'See more'}
                </Typography>
              )}
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="overline" 
                sx={{ 
                  color: theme.palette.text.secondary, 
                  letterSpacing: 2,
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  mb: 1.5,
                  display: 'block',
                }}
              >
                GENRES
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {genres && genres.length > 0 && genres.map((genre: string, index: number) => (
                  <Chip 
                    key={index} 
                    label={genre} 
                    size="small"
                    sx={{ 
                      color: theme.palette.text.primary,
                      bgcolor: theme.palette.action.hover,
                      borderRadius: 1.5,
                      fontSize: '0.85rem',
                      '&:hover': {
                        bgcolor: theme.palette.action.selected,
                      }
                    }} 
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', fontSize: '1.1rem' }}>
                    Chapters
                  </Typography>
                  <Chip 
                    label={chapters?.length || 0} 
                    size="small"
                    sx={{ 
                      bgcolor: theme.palette.action.hover, 
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                </Box>
                
                <Button
                  size="small"
                  endIcon={<Box component="span">{sortOrder === 'newest' ? '▼' : '▲'}</Box>}
                  onClick={toggleSort}
                  sx={{
                    color: theme.palette.text.secondary,
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    '&:hover': {
                      color: theme.palette.text.primary,
                    },
                  }}
                >
                  {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                </Button>
              </Box>

              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1, fontSize: '0.7rem' }}>
                Right-click or long press on a chapter for options
              </Typography>

              <Paper 
                elevation={0}
                sx={{ 
                  bgcolor: 'transparent',
                  borderRadius: 2,
                }}
              >
                <List disablePadding>
                  {sortedChapters.map((chapter: any) => {
                    const chapterId = String(chapter.id || chapter.number);
                    const isRead = chapter.read || false;
                    const isDownloading = isChapterDownloading(chapter);
                    
                    return (
                      <Box
                        key={chapterId}
                        onContextMenu={(e) => handleContextMenu(e, chapter)}
                        onTouchStart={() => handleTouchStart(chapter)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                        sx={{
                          mb: 1,
                          borderRadius: 1,
                          bgcolor: isRead 
                            ? 'rgba(255, 255, 255, 0.03)' 
                            : 'transparent',
                          borderLeft: isRead 
                            ? `3px solid ${theme.palette.text.disabled}` 
                            : '3px solid transparent',
                          opacity: isRead ? 0.6 : 1,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <ListItem disablePadding>
                          <ListItemButton 
                            onClick={() => onChapterClick && onChapterClick(chapter)}
                            sx={{
                              py: 1.5,
                              px: 2,
                              borderRadius: 1,
                            }}
                          >
                            <ListItemText 
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontWeight: 'medium',
                                      color: isRead ? theme.palette.text.disabled : theme.palette.text.primary,
                                      fontSize: '0.95rem',
                                    }}
                                  >
                                    {chapter.title || `Chapter ${chapter.number}`}
                                  </Typography>
                                  {isRead && (
                                    <Chip
                                      label="Read"
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.6rem',
                                        bgcolor: theme.palette.text.disabled,
                                        color: theme.palette.background.default,
                                      }}
                                    />
                                  )}
                                  {isDownloading && (
                                    <CircularProgress size={16} sx={{ color: theme.palette.primary.main }} />
                                  )}
                                </Box>
                              }
                              secondary={chapter.date ? formatTimeAgo(chapter.date) : ''}
                              secondaryTypographyProps={{
                                color: theme.palette.text.secondary,
                                fontSize: '0.8rem',
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      </Box>
                    );
                  })}
                </List>
              </Paper>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <ChapterContextMenu
        open={contextMenu !== null}
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : null}
        chapterId={contextMenu?.chapterId || null}
        isFavorite={false}
        isRead={contextMenu?.isRead || false}
        isDownloaded={false}
        isDownloading={!!(contextMenu && isChapterDownloading(contextMenu.chapter))}
        isInLibrary={isInLibrary}
        onClose={handleCloseContextMenu}
        onToggleFavorite={() => {}}
        onToggleRead={handleToggleRead}
        onDownload={handleDownloadChapter}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderRadius: 2,
            '& .MuiAlert-icon': { 
              color: snackbar.severity === 'success' ? theme.palette.success.main : theme.palette.error.main 
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}