// src/components/ui/layout/sidebar/chapter.tsx
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ReadingSettings, type ReadingMode } from '~/components';

interface ChapterControlsProps {
  currentPage: number;
  totalImages: number;
  chapterNumber: string;
  isFirstChapter: boolean;
  readingMode: ReadingMode;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
  onReadingModeChange: (mode: ReadingMode) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  isPagedMode: boolean;
}

export function ChapterControls({
  currentPage,
  totalImages,
  chapterNumber,
  isFirstChapter,
  readingMode,
  onPrevChapter,
  onNextChapter,
  onScrollToTop,
  onScrollToBottom,
  onReadingModeChange,
  onPrevPage,
  onNextPage,
  isPagedMode,
}: ChapterControlsProps) {
  return (
    <Box
      sx={{
        position: 'fixed',
        right: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {isPagedMode && (
        <>
          <Tooltip title="Previous page" placement="left">
            <IconButton
              onClick={onPrevPage}
              disabled={currentPage === 0}
              sx={{
                bgcolor: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                width: 40,
                height: 40,
              }}
            >
              <ExpandLessIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box
            sx={{
              bgcolor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 2,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              fontSize: '0.7rem',
              textAlign: 'center',
              flexDirection: 'column',
              lineHeight: 1.2,
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>
              Page
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
              {totalImages > 0 ? `${currentPage + 1}` : '0'}
            </Typography>
          </Box>

          <Tooltip title="Next page" placement="left">
            <IconButton
              onClick={onNextPage}
              disabled={currentPage >= totalImages - 1}
              sx={{
                bgcolor: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                width: 40,
                height: 40,
              }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}

      {!isPagedMode && (
        <>
          <Tooltip title="Previous chapter" placement="left">
            <span>
              <IconButton
                onClick={onPrevChapter}
                disabled={isFirstChapter}
                sx={{
                  bgcolor: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  width: 40,
                  height: 40,
                }}
              >
                <ExpandLessIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Box
            sx={{
              bgcolor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 2,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              fontSize: '0.7rem',
              textAlign: 'center',
              flexDirection: 'column',
              lineHeight: 1.2,
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>
              Page
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
              {totalImages > 0 ? `${currentPage + 1}` : '0'}
            </Typography>
          </Box>

          <Tooltip title="Next chapter" placement="left">
            <IconButton
              onClick={onNextChapter}
              sx={{
                bgcolor: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                width: 40,
                height: 40,
              }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}

      <Tooltip title="Scroll to top" placement="left">
        <IconButton
          onClick={onScrollToTop}
          sx={{
            bgcolor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            width: 40,
            height: 40,
          }}
        >
          <ArrowBackIcon fontSize="small" sx={{ transform: 'rotate(90deg)' }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Scroll to bottom" placement="left">
        <IconButton
          onClick={onScrollToBottom}
          sx={{
            bgcolor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            width: 40,
            height: 40,
          }}
        >
          <ArrowForwardIcon fontSize="small" sx={{ transform: 'rotate(90deg)' }} />
        </IconButton>
      </Tooltip>

      <ReadingSettings
        readingMode={readingMode}
        onReadingModeChange={onReadingModeChange}
      />
    </Box>
  );
}