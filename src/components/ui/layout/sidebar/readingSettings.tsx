// src/components/ui/layout/sidebar/ReadingSettings.tsx
import { useState } from 'react';
import {
  IconButton,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export type ReadingMode = 'long-strip' | 'long-strip-gap' | 'paged-rtl' | 'paged-ltr' | 'paged-vertical';

interface ReadingSettingsProps {
  readingMode: ReadingMode;
  onReadingModeChange: (mode: ReadingMode) => void;
}

const readingModes: { value: ReadingMode; label: string; icon: React.ReactNode }[] = [
  { value: 'long-strip', label: 'Long Strip', icon: <ViewStreamIcon /> },
  { value: 'long-strip-gap', label: 'Long Strip with Gaps', icon: <ViewListIcon /> },
  { value: 'paged-rtl', label: 'Paged (Right to Left)', icon: <ChevronLeftIcon /> },
  { value: 'paged-ltr', label: 'Paged (Left to Right)', icon: <ChevronRightIcon /> },
  { value: 'paged-vertical', label: 'Paged (Vertical)', icon: <ViewCarouselIcon /> },
];

export function ReadingSettings({ readingMode, onReadingModeChange }: ReadingSettingsProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleModeChange = (mode: ReadingMode) => {
    onReadingModeChange(mode);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          bgcolor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          width: 40,
          height: 40,
        }}
      >
        <MenuIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(13, 13, 13, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 2,
            minWidth: 220,
            p: 1,
          },
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', px: 2, py: 1 }}>
          Reading Mode
        </Typography>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 1 }} />
        {readingModes.map((mode) => (
          <MenuItem
            key={mode.value}
            onClick={() => handleModeChange(mode.value)}
            selected={readingMode === mode.value}
            sx={{
              borderRadius: 1,
              color: readingMode === mode.value ? theme.palette.primary.main : 'rgba(255,255,255,0.7)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.05)',
              },
              '&.Mui-selected': {
                bgcolor: `${theme.palette.primary.main}33`,
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
              {mode.icon}
            </ListItemIcon>
            <ListItemText primary={mode.label} />
            {readingMode === mode.value && (
              <Chip
                label="Active"
                size="small"
                sx={{
                  bgcolor: `${theme.palette.primary.main}33`,
                  color: theme.palette.primary.main,
                  fontSize: '0.6rem',
                  height: 20,
                }}
              />
            )}
          </MenuItem>
        ))}
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1 }} />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', px: 2, py: 0.5 }}>
          {readingMode.startsWith('paged-') ? 'Use arrow buttons to navigate' : 'Scroll to read continuously'}
        </Typography>
      </Menu>
    </>
  );
}