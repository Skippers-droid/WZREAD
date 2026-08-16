// src/pages/details.tsx
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Container,
  CircularProgress,
  Typography,
  useTheme,
  Snackbar,
  Alert,
} from '@mui/material';
import { DetailsInfo } from '~/components';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/components';

export function Details() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { extensionId, bookId } = useParams<{ extensionId: string; bookId: string }>();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedComicId, setSavedComicId] = useState<number | null>(null);

  const { data: sourceExtensions } = useQuery({
    queryKey: ['sourceExtensions'],
    queryFn: () => api.sources.getExtensions(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: sources } = useQuery({
    queryKey: ['sources'],
    queryFn: () => api.sources.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const activeSource = sources?.find((s: any) => s.is_active == 1);

  const { data: mangaData, isLoading, error } = useQuery({
    queryKey: ['mangaInfo', extensionId, bookId],
    queryFn: () => api.extension.getMangaInfo(extensionId || '', bookId || ''),
    enabled: !!extensionId && !!bookId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: existingComic, refetch: refetchComic } = useQuery({
    queryKey: ['comic', extensionId, bookId],
    queryFn: () => api.comics.get(extensionId || '', bookId || ''),
    enabled: !!extensionId && !!bookId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (existingComic) {
      setSavedComicId(existingComic.id);
    }
  }, [existingComic]);

  const { data: readingHistory } = useQuery({
    queryKey: ['readingHistoryExt', extensionId, bookId],
    queryFn: () => api.history.get(extensionId || '', bookId || ''),
    enabled: !!extensionId && !!bookId,
    staleTime: 5 * 60 * 1000,
  });

  const extensionInfo = sourceExtensions?.extensions?.find(
    (ext: any) => ext.id?.toLowerCase() === extensionId?.toLowerCase()
  );

  const handleChapterClick = async (chapter: any) => {
    const chapterNumber = chapter.number || chapter.chapterNumber || chapter.id;
    
    if (!extensionId || !bookId) {
      console.error('Missing extensionId or bookId');
      setSnackbar({
        open: true,
        message: 'Missing comic information',
        severity: 'error',
      });
      return;
    }

    if (!chapterNumber) {
      console.error('Missing chapter number');
      setSnackbar({
        open: true,
        message: 'Invalid chapter data',
        severity: 'error',
      });
      return;
    }

    try {
      const chapterSlug = chapter.slug || `chapter-${chapterNumber}`;
      const title = mangaData?.title || 'Unknown Comic';
      
      await api.history.save({
        extension_id: extensionId,
        book_id: bookId,
        chapter_number: parseInt(chapterNumber),
        chapter_slug: chapterSlug,
        title: title,
        page_number: 1,
      });
      
      queryClient.invalidateQueries({ queryKey: ['readingHistoryExt', extensionId, bookId] });
      navigate(`/chapter/${extensionId}/${bookId}/${chapterNumber}`);
    } catch (err) {
      console.error('Failed to save reading history:', err);
      setSnackbar({
        open: true,
        message: 'Failed to save progress, but continuing to chapter',
        severity: 'error',
      });
      navigate(`/chapter/${extensionId}/${bookId}/${chapterNumber}`);
    }
  };

  const handleAddToLibrary = async () => {
    if (!mangaData || !extensionInfo) {
      setSnackbar({
        open: true,
        message: 'Cannot save: missing comic data',
        severity: 'error',
      });
      return;
    }

    if (!activeSource) {
      setSnackbar({
        open: true,
        message: 'No active source found. Please add a source first.',
        severity: 'error',
      });
      return;
    }

    try {
      setIsSaving(true);
      const savedComic = await api.comics.save({
        extension_id: extensionId || '',
        book_id: bookId || '',
        slug: mangaData.slug || mangaData.id || bookId || '',
        title: mangaData.title || 'Untitled',
        alt_title: mangaData.altTitle || '',
        author: mangaData.author || '',
        description: mangaData.description || '',
        cover: mangaData.cover || '',
        status: mangaData.status || '',
        type: mangaData.type || '',
      });

      setSavedComicId(savedComic.id);

      setSnackbar({
        open: true,
        message: 'Comic saved to library!',
        severity: 'success',
      });

      queryClient.invalidateQueries({ queryKey: ['comic', extensionId, bookId] });
      queryClient.invalidateQueries({ queryKey: ['comics'] });
      await refetchComic();
    } catch (err) {
      console.error('Save error:', err);
      setSnackbar({
        open: true,
        message: (err as Error).message || 'Failed to save comic',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFromLibrary = async () => {
    if (!existingComic) return;
    try {
      await api.comics.delete(existingComic.id);
      setSavedComicId(null);
      setSnackbar({
        open: true,
        message: 'Removed from library',
        severity: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['comic', extensionId, bookId] });
      queryClient.invalidateQueries({ queryKey: ['comics'] });
      queryClient.invalidateQueries({ queryKey: ['readingHistoryExt', extensionId, bookId] });
      await refetchComic();
    } catch (err) {
      console.error('Remove error:', err);
      setSnackbar({
        open: true,
        message: (err as Error).message || 'Failed to remove from library',
        severity: 'error',
      });
    }
  };

  const handleChapterReadToggle = (chapter: any) => {
    const isRead = !chapter.read;
    const chapterNumber = chapter.number || chapter.id;
    const chapterSlug = chapter.slug || `${chapterNumber}`;
    
    api.history.save({
      extension_id: extensionId || '',
      book_id: bookId || '',
      chapter_number: parseInt(chapterNumber),
      chapter_slug: chapterSlug,
      title: chapter.title || `Chapter ${chapterNumber}`,
      page_number: isRead ? 1 : 0,
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['readingHistoryExt', extensionId, bookId] });
      refetchComic();
    }).catch(console.error);
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getChapterStatus = (chapter: any) => {
    if (!readingHistory?.history) return { read: false };
    const key = chapter.slug || `${chapter.number}`;
    const entry = readingHistory.history[key];
    if (!entry) return { read: false };
    return {
      read: true,
      page_number: entry.page_number,
    };
  };

  const chaptersWithStatus = mangaData?.chapters?.map((chapter: any) => {
    const status = getChapterStatus(chapter);
    return {
      ...chapter,
      id: chapter.number || chapter.id,
      read: status.read,
    };
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (error || !mangaData || !mangaData.id) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
        <Typography variant="h5" color={theme.palette.text.secondary}>
          {(error as Error)?.message || 'Manga not found'}
        </Typography>
      </Box>
    );
  }

  const isInLibrary = !!existingComic;

  return (
    <Box 
      sx={{ 
        display: 'flex',
        backgroundImage: mangaData.cover ? `url(${mangaData.cover})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
        position: 'relative',
        bgcolor: theme.palette.background.default,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(13, 13, 13, 0.3) 0%, rgba(13, 13, 13, 0.85) 40%, rgba(13, 13, 13, 0.95) 100%)',
          zIndex: 0,
        }
      }}
    >
      <CssBaseline />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: { xs: 2, md: 4 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <DetailsInfo 
            title={mangaData.title}
            altTitle={mangaData.altTitle}
            author={mangaData.author}
            status={mangaData.status}
            genres={mangaData.genres}
            description={mangaData.description}
            cover={mangaData.cover}
            chapters={chaptersWithStatus || []}
            extensionId={extensionId}
            bookId={bookId}
            comicId={savedComicId || existingComic?.id}
            sourceLink={activeSource?.source_link}
            onChapterClick={handleChapterClick}
            onAddToLibrary={handleAddToLibrary}
            onRemoveFromLibrary={handleRemoveFromLibrary}
            onChapterReadToggle={handleChapterReadToggle}
            isSaving={isSaving}
            isInLibrary={isInLibrary}
          />
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