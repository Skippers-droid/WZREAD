import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  CircularProgress,
  Typography,
  useTheme,
  Snackbar,
  Alert,
} from '@mui/material';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useChapterImages,
  useReadingProgress,
  ChapterControls,
  type ReadingMode,
} from '~/components';
import { api } from '~/components';

export function Chapter() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { extensionId, bookId, chapterNumber } = useParams<{
    extensionId: string;
    bookId: string;
    chapterNumber: string
  }>();

  const [readingMode, setReadingMode] = useState<ReadingMode>(() => {
    const saved = localStorage.getItem('readingMode');
    return (saved as ReadingMode) || 'long-strip';
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const lastSavedPageRef = useRef<number>(-1);
  const initialLoadDoneRef = useRef(false);
  const restoreAttemptsRef = useRef(0);
  const maxRestoreAttempts = 50;

  const { data: comicData, isLoading: comicLoading } = useQuery({
    queryKey: ['comic', extensionId, bookId],
    queryFn: () => api.comics.get(extensionId || '', bookId || ''),
    enabled: !!extensionId && !!bookId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: sources } = useQuery({
    queryKey: ['sources'],
    queryFn: () => api.sources.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const activeSource = sources?.find((s: any) => s.is_active == 1);

  const comicId = comicData?.id || 0;

  const {
    images,
    totalImages,
    isLoading: imagesLoading,
    isLoadingMore,
    error: imagesError,
  } = useChapterImages({
    extensionId: extensionId || '',
    bookId: bookId || '',
    chapterNumber: chapterNumber || '',
    chapterSlug: chapterNumber || '',
    chapterTitle: `Chapter ${chapterNumber}`,
    comicTitle: comicData?.title || 'Unknown Comic',
    comicId: comicId,
    sourceLink: activeSource?.source_link || '',
  });

  const {
    currentPage,
    currentOffset,
    updateCurrentPage,
    isLoading: progressLoading,
    isInitialized,
  } = useReadingProgress({
    comicId: comicId,
    chapterNumber: chapterNumber || '',
    extensionId: extensionId || '',
    bookId: bookId || '',
    title: comicData?.title || undefined,
    cover: comicData?.cover || undefined,
  });

  const isPagedMode = readingMode.startsWith('paged-');

  useEffect(() => {
    initialLoadDoneRef.current = false;
    lastSavedPageRef.current = -1;
    restoreAttemptsRef.current = 0;
  }, [chapterNumber, bookId, extensionId]);

  const restoreScrollPosition = useCallback(() => {
    if (images.length === 0) return false;

    const targetPage = currentPage > 0 && currentPage < images.length ? currentPage : 0;
    const targetElement = document.getElementById(`page-${targetPage}`);

    if (targetElement) {
      if (!isPagedMode) {
        targetElement.scrollIntoView({ behavior: 'instant', block: 'start' });
        if (currentOffset > 0) {
          window.scrollTo({ top: window.scrollY + currentOffset, behavior: 'instant' });
        }
      }
      lastSavedPageRef.current = targetPage;
      restoreAttemptsRef.current = 0;
      initialLoadDoneRef.current = true;
      return true;
    }
    return false;
  }, [images, currentPage, currentOffset, isPagedMode]);

  useEffect(() => {
    if (images.length > 0 && !initialLoadDoneRef.current && isInitialized) {
      const tryRestore = () => {
        if (restoreAttemptsRef.current >= maxRestoreAttempts) {
          initialLoadDoneRef.current = true;
          window.scrollTo({ top: 0, behavior: 'instant' });
          lastSavedPageRef.current = 0;
          updateCurrentPage(0, 0);
          return;
        }

        const success = restoreScrollPosition();
        if (success) return;

        restoreAttemptsRef.current++;
        setTimeout(tryRestore, 100);
      };

      setTimeout(tryRestore, 150);
    }
  }, [images, currentPage, currentOffset, isInitialized, restoreScrollPosition, updateCurrentPage, maxRestoreAttempts, isPagedMode]);

  const findMostVisiblePage = useCallback(() => {
    const pageElements = document.querySelectorAll('[id^="page-"]');
    if (pageElements.length === 0) return -1;

    let mostVisibleIndex = 0;
    let maxVisibleArea = 0;

    for (let i = 0; i < pageElements.length; i++) {
      const rect = pageElements[i].getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(viewportHeight, rect.bottom);
      const visibleLeft = Math.max(0, rect.left);
      const visibleRight = Math.min(viewportWidth, rect.right);

      const visibleWidth = Math.max(0, visibleRight - visibleLeft);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibleArea = visibleWidth * visibleHeight;

      if (visibleArea > maxVisibleArea) {
        maxVisibleArea = visibleArea;
        mostVisibleIndex = i;
      }
    }

    return mostVisibleIndex;
  }, []);

  const getPageOffset = useCallback((pageIndex: number): number => {
    const element = document.getElementById(`page-${pageIndex}`);
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    return Math.max(0, -rect.top);
  }, []);

  const checkVisiblePage = useCallback(() => {
    if (!initialLoadDoneRef.current || images.length === 0 || isPagedMode) return;

    const mostVisibleIndex = findMostVisiblePage();

    if (mostVisibleIndex !== -1 && mostVisibleIndex !== lastSavedPageRef.current) {
      lastSavedPageRef.current = mostVisibleIndex;
      const offset = getPageOffset(mostVisibleIndex);
      updateCurrentPage(mostVisibleIndex, offset);
    } else if (mostVisibleIndex !== -1) {
      const offset = getPageOffset(mostVisibleIndex);
      if (Math.abs(offset - currentOffset) > 20) {
        updateCurrentPage(mostVisibleIndex, offset);
      }
    }
  }, [findMostVisiblePage, getPageOffset, images.length, currentOffset, isPagedMode, updateCurrentPage]);

  useEffect(() => {
    let scrollTimeout: number | null = null;
    const handleScroll = () => {
      if (scrollTimeout) {
        cancelAnimationFrame(scrollTimeout);
      }
      scrollTimeout = requestAnimationFrame(() => {
        checkVisiblePage();
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        cancelAnimationFrame(scrollTimeout);
      }
    };
  }, [checkVisiblePage]);

  const handleReadingModeChange = (mode: ReadingMode) => {
    setReadingMode(mode);
    localStorage.setItem('readingMode', mode);
    initialLoadDoneRef.current = false;
    restoreAttemptsRef.current = 0;
    setTimeout(() => {
      if (images.length > 0) {
        const targetPage = currentPage > 0 && currentPage < images.length ? currentPage : 0;
        const targetElement = document.getElementById(`page-${targetPage}`);
        if (targetElement && !mode.startsWith('paged-')) {
          targetElement.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
        initialLoadDoneRef.current = true;
      }
    }, 100);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      updateCurrentPage(newPage, 0);
      const element = document.getElementById(`page-${newPage}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < images.length - 1) {
      const newPage = currentPage + 1;
      updateCurrentPage(newPage, 0);
      const element = document.getElementById(`page-${newPage}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleNextChapter = () => {
    const nextChapter = parseInt(chapterNumber || '0') + 1;
    navigate(`/chapter/${extensionId}/${bookId}/${nextChapter}`);
  };

  const handlePrevChapter = () => {
    const prevChapter = parseInt(chapterNumber || '0') - 1;
    if (prevChapter > 0) {
      navigate(`/chapter/${extensionId}/${bookId}/${prevChapter}`);
    } else {
      setSnackbar({
        open: true,
        message: 'You are on the first chapter',
        severity: 'error',
      });
    }
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    lastSavedPageRef.current = 0;
    updateCurrentPage(0, 0);
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    const lastIndex = images.length - 1;
    lastSavedPageRef.current = lastIndex;
    updateCurrentPage(lastIndex, 0);
  };

  const isLoading = imagesLoading || comicLoading || progressLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', bgcolor: theme.palette.background.default }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (imagesError) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', bgcolor: theme.palette.background.default }}>
        <Typography variant="h5" color={theme.palette.text.secondary}>
          {imagesError.message || 'Chapter not found'}
        </Typography>
      </Box>
    );
  }

  if (images.length === 0) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', bgcolor: theme.palette.background.default }}>
        <Typography variant="h5" color={theme.palette.text.secondary}>
          No images found for this chapter
        </Typography>
      </Box>
    );
  }

  const isFirstChapter = parseInt(chapterNumber || '0') <= 1;
  const gap = readingMode === 'long-strip-gap' ? 4 : 0;

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      minHeight: '100vh',
      bgcolor: theme.palette.background.default,
    }}>
      <CssBaseline />

      <ChapterControls
        currentPage={currentPage}
        totalImages={totalImages}
        chapterNumber={chapterNumber || ''}
        isFirstChapter={isFirstChapter}
        readingMode={readingMode}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
        onScrollToTop={scrollToTop}
        onScrollToBottom={scrollToBottom}
        onReadingModeChange={handleReadingModeChange}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        isPagedMode={isPagedMode}
      />

      <Box
        sx={{
          width: '100%',
          bgcolor: theme.palette.background.default,
          px: { xs: 1, sm: 2, md: 3 },
          py: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: gap,
            maxWidth: isPagedMode ? '600px' : '900px',
            mx: 'auto',
            width: '100%',
            pb: 4,
          }}
        >
          {images.map((image: string, index: number) => (
            <Box
              id={`page-${index}`}
              key={index}
              data-page-index={index}
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                minHeight: '100px',
                ...(isPagedMode && {
                  display: index === currentPage ? 'flex' : 'none',
                }),
                ...(readingMode === 'paged-rtl' && {
                  direction: 'rtl',
                }),
              }}
            >
              <img
                src={image}
                alt={`Page ${index + 1}`}
                loading="lazy"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  borderRadius: 0,
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </Box>
          ))}
        </Box>

        {isLoadingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: theme.palette.primary.main }} />
          </Box>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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