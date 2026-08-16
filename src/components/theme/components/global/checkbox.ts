import type { Theme } from '@mui/material/styles';

export const MuiCheckbox = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      padding: 8,
      borderRadius: 12,
      transition: 'all 0.2s ease',
      color: theme.palette.text.secondary,

      '&:hover': {
        backgroundColor: theme.palette.action.hover,
        transform: 'scale(1.05)',
      },

      '&.Mui-checked': {
        color: theme.palette.primary.main,
      },
    }),
  },
};

export const MuiFormControlLabel = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      marginLeft: -8,
      marginRight: 0,
      '& .MuiTypography-root': {
        color: theme.palette.text.primary,
        fontSize: '0.875rem',
        fontWeight: 500,
      },
    }),
  },
};