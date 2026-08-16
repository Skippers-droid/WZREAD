import { Popover, MenuList, MenuItem, useTheme, CircularProgress } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DownloadIcon from '@mui/icons-material/Download';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';

interface ChapterContextMenuProps {
  open: boolean;
  anchorPosition: { top: number; left: number } | null;
  chapterId: string | null;
  isFavorite: boolean;
  isRead: boolean;
  isDownloaded?: boolean;
  isDownloading?: boolean;
  isInLibrary?: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onToggleRead: () => void;
  onDownload?: () => void;
}

export function ChapterContextMenu({
  open,
  anchorPosition,
  chapterId,
  isFavorite,
  isRead,
  isDownloaded = false,
  isDownloading = false,
  isInLibrary = false,
  onClose,
  onToggleFavorite,
  onToggleRead,
  onDownload,
}: ChapterContextMenuProps) {
  const theme = useTheme();

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        anchorPosition
          ? { top: anchorPosition.top, left: anchorPosition.left }
          : undefined
      }
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.paper,
          boxShadow: theme.shadows[8],
          borderRadius: 2,
          minWidth: 200,
        },
      }}
    >
      <MenuList>
        <MenuItem onClick={onToggleFavorite}>
          {isFavorite ? (
            <>
              <StarIcon sx={{ mr: 1.5, fontSize: '1.2rem', color: theme.palette.warning.main }} />
              Unmark Favorite
            </>
          ) : (
            <>
              <StarBorderIcon sx={{ mr: 1.5, fontSize: '1.2rem' }} />
              Mark as Favorite
            </>
          )}
        </MenuItem>
        <MenuItem onClick={onToggleRead}>
          {isRead ? (
            <>
              <RadioButtonUncheckedIcon sx={{ mr: 1.5, fontSize: '1.2rem' }} />
              Unmark Read
            </>
          ) : (
            <>
              <CheckCircleIcon sx={{ mr: 1.5, fontSize: '1.2rem', color: theme.palette.success.main }} />
              Mark as Read
            </>
          )}
        </MenuItem>
        {onDownload && (
          <MenuItem onClick={onDownload} disabled={isDownloading || !isInLibrary}>
            {isDownloading ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1.5 }} />
                Downloading...
              </>
            ) : isDownloaded ? (
              <>
                <DownloadDoneIcon sx={{ mr: 1.5, fontSize: '1.2rem', color: theme.palette.success.main }} />
                Downloaded
              </>
            ) : !isInLibrary ? (
              <>
                <DownloadIcon sx={{ mr: 1.5, fontSize: '1.2rem', color: theme.palette.text.disabled }} />
                Save to library first
              </>
            ) : (
              <>
                <DownloadIcon sx={{ mr: 1.5, fontSize: '1.2rem' }} />
                Download Chapter
              </>
            )}
          </MenuItem>
        )}
      </MenuList>
    </Popover>
  );
}