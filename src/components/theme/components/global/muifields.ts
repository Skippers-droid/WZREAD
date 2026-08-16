// src/components/theme/components/global/muifields.ts
import type { Components, Theme } from '@mui/material/styles';

export const MuiGlassOverrides: Components<Theme> = {
  // Removed MuiButton to prevent conflicts with btn.ts

  MuiChip: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 12,
        fontWeight: 600,
        height: 28,
        padding: '0 6px',
        transition: 'all 0.18s ease',
        background: `linear-gradient(135deg, ${theme.palette.glass.main}, ${theme.palette.glass.light})`,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
        '&:hover': {
          transform: 'translateY(-1px) scale(1.02)',
          boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
        },
        '& .MuiChip-label': {
          paddingLeft: 10,
          paddingRight: 10,
        },
      }),
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 10,
        margin: '3px 6px',
        transition: 'all 0.15s ease',
        color: theme.palette.text.primary,
        backgroundColor: 'transparent',
        '&:hover': {
          backgroundColor: `${theme.palette.primary.main}0f`,
          transform: 'translateX(3px)',
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

  MuiSelect: {
    styleOverrides: {
      select: ({ theme }) => ({
        borderRadius: 10,
        background: theme.palette.glass.main,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.palette.divider}`,
        padding: '10px 14px',
        transition: 'all 0.18s ease',
        color: theme.palette.text.primary,
        '&:focus': {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`,
        },
      }),
      icon: ({ theme }) => ({
        color: theme.palette.text.secondary,
      }),
    },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 10,
        background: theme.palette.glass.main,
        backdropFilter: 'blur(12px)',
        transition: 'all 0.18s ease',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.divider,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.text.secondary,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
          borderWidth: 1.5,
          boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`,
        },
        '& input, & textarea': {
          color: theme.palette.text.primary,
        },
      }),
      input: {
        padding: '10px 12px',
      },
    },
  },

  MuiInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.text.primary,
        '&:before': {
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
        '&:hover:not(.Mui-disabled):before': {
          borderBottom: `1px solid ${theme.palette.text.secondary}`,
        },
        '&:after': {
          borderBottom: `2px solid ${theme.palette.primary.main}`,
        },
      }),
    },
  },

  MuiFormLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.text.secondary,
        transition: 'all 0.15s ease',
        '&.Mui-focused': {
          color: theme.palette.primary.main,
        },
      }),
    },
  },
};