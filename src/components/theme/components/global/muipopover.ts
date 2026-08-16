import type { Theme } from '@mui/material/styles';

export const MuiMenuItem = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      borderRadius: '8px',
      margin: '4px 8px',
      padding: '8px 12px',
      transition: 'all 0.2s ease',
      color: theme.palette.text.primary,
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: `${theme.palette.primary.main}0f`,
        transform: 'translateX(4px)',
      },
      '&.Mui-selected': {
        backgroundColor: `${theme.palette.primary.main}1a`,
        color: theme.palette.primary.main,
        '&:hover': {
          backgroundColor: `${theme.palette.primary.main}2a`,
        },
      },
      '&:active': {
        backgroundColor: `${theme.palette.primary.main}2a`,
      },
    }),
  },
};

export const MuiList = {
  styleOverrides: {
    root: {
      padding: '4px 0',
    },
  },
};

export const MuiPopover = {
  styleOverrides: {
    paper: ({ theme }: { theme: Theme }) => ({
      borderRadius: '12px',
      background: theme.palette.background.paper,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: theme.customShadows?.lg || theme.shadows[8],
      overflow: 'hidden',
    }),
  },
};

export const MuiListSubheader = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      backgroundColor: 'transparent',
      color: theme.palette.text.secondary,
      fontWeight: 600,
      fontSize: '0.75rem',
      letterSpacing: '0.5px',
      textTransform: 'uppercase' as const,
      padding: '8px 16px',
    }),
  },
};