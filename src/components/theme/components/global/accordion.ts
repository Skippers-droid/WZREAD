import type { Components, Theme } from '@mui/material/styles';

const border = '1px solid rgba(255,255,255,0.12)';
const glassBg = 'rgba(255,255,255,0.05)';
const glassHover = 'rgba(255,255,255,0.08)';

export const MuiFormOverrides: Components<Theme> = {
  MuiFormControl: {
    styleOverrides: {
      root: {
        width: '100%',
        minWidth: 100,
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontSize: '0.75rem',
        color: theme.palette.text.secondary,
        '&.Mui-focused': {
          color: theme.palette.primary.main,
        },
      }),
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        fontSize: '0.875rem',
        background: glassBg,
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'transparent',
        },
        '&:hover': {
          background: glassHover,
        },
        '&.Mui-focused': {
          background: glassHover,
        },
        '& input, & textarea': {
          padding: '10px 12px',
          color: theme.palette.text.primary,
        },
      }),
    },
  },
  MuiSelect: {
    styleOverrides: {
      select: ({ theme }) => ({
        borderRadius: 8,
        background: glassBg,
        backdropFilter: 'blur(10px)',
        padding: '8px 10px',
        fontSize: '0.875rem',
        color: theme.palette.text.primary,
      }),
      icon: ({ theme }) => ({
        color: theme.palette.text.secondary,
      }),
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: ({ theme }) => ({
        background: theme.palette.background.paper,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 10,
        marginTop: 6,
        padding: 6,
        boxShadow: theme.customShadows?.lg || '0 8px 32px rgba(0,0,0,0.3)',
      }),
      list: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        fontSize: '0.875rem',
        transition: 'all 0.15s ease',
        color: theme.palette.text.primary,
        backgroundColor: 'transparent',
        '&:hover': {
          backgroundColor: `${theme.palette.primary.main}0f`,
          transform: 'translateX(2px)',
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
  },
  MuiAccordion: {
    styleOverrides: {
      root: {
        background: 'transparent',
        border,
        borderRadius: 10,
        boxShadow: 'none',
        '&:before': {
          display: 'none',
        },
        '&.Mui-expanded': {
          margin: 0,
        },
      },
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        minHeight: 40,
        padding: '0 12px',
      },
      content: {
        margin: '10px 0',
      },
    },
  },
  MuiAccordionDetails: {
    styleOverrides: {
      root: {
        borderTop: border,
        padding: 12,
      },
    },
  },
};