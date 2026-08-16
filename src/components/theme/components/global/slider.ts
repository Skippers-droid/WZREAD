import type { Theme } from '@mui/material/styles';

export const MuiSlider = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      color: theme.palette.primary.main,
      height: 4,
      padding: '13px 0',
      '& .MuiSlider-thumb': {
        height: 14,
        width: 14,
        backgroundColor: theme.palette.primary.main,
        '&:hover': {
          boxShadow: theme.customShadows.neon,
        },
        '&:focus, &.Mui-active': {
          boxShadow: theme.customShadows.neon,
        },
      },
      '& .MuiSlider-track': {
        height: 4,
        borderRadius: 4,
        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
      },
      '& .MuiSlider-rail': {
        height: 4,
        borderRadius: 4,
        backgroundColor: theme.palette.divider,
        opacity: 0.5,
      },
      '& .MuiSlider-valueLabel': {
        fontSize: 12,
        fontWeight: 600,
        background: theme.palette.glass.main,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
        borderRadius: '8px',
        padding: '4px 8px',
        '&:before': {
          display: 'none',
        },
      },
      '& .MuiSlider-mark': {
        backgroundColor: theme.palette.text.disabled,
        height: 4,
        width: 2,
        '&.MuiSlider-markActive': {
          backgroundColor: theme.palette.primary.main,
          opacity: 0.8,
        },
      },
      '& .MuiSlider-markLabel': {
        color: theme.palette.text.secondary,
        fontSize: '0.75rem',
        '&.MuiSlider-markLabelActive': {
          color: theme.palette.text.primary,
        },
      },
    }),
    thumb: ({ theme }: { theme: Theme }) => ({
      '&:hover': {
        boxShadow: theme.customShadows.neon,
      },
    }),
    track: ({ theme }: { theme: Theme }) => ({
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    }),
    rail: ({ theme }: { theme: Theme }) => ({
      backgroundColor: theme.palette.divider,
    }),
    valueLabel: ({ theme }: { theme: Theme }) => ({
      background: theme.palette.glass.main,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
      borderRadius: '8px',
      padding: '4px 8px',
    }),
  },
};