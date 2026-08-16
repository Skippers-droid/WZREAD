import type { Theme } from '@mui/material/styles'

export const MuiChip = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      borderRadius: '10px',
      fontWeight: 600,
      transition: 'all 0.2s ease',
      border: `1px solid ${theme.palette.divider}`,
      background: theme.palette.glass.main,
      backdropFilter: 'blur(10px)',
      color: theme.palette.text.primary,
      height: 28,

      '&:hover': {
        background: theme.palette.glass.light,
        transform: 'translateY(-1px)',
      },

      '& .MuiChip-label': {
        paddingLeft: 10,
        paddingRight: 10,
      },

      '& .MuiChip-deleteIcon': {
        color: theme.palette.text.secondary,
        '&:hover': {
          color: theme.palette.text.primary,
        },
      },
    }),

    sizeSmall: {
      height: 24,
      fontSize: '0.75rem',
    },

    sizeMedium: {
      height: 28,
      fontSize: '0.8125rem',
    },

    clickable: ({ theme }: { theme: Theme }) => ({
      '&:hover': {
        background: theme.palette.glass.light,
      },
      '&:active': {
        transform: 'scale(0.98)',
      },
    }),

    deletable: ({ theme }: { theme: Theme }) => ({
      '& .MuiChip-deleteIcon': {
        fontSize: 16,
      },
    }),

    colorPrimary: ({ theme }: { theme: Theme }) => ({
      background: theme.palette.primary.main + '20',
      borderColor: theme.palette.primary.main,
      color: theme.palette.primary.main,
      '&:hover': {
        background: theme.palette.primary.main + '30',
      },
    }),

    colorSecondary: ({ theme }: { theme: Theme }) => ({
      background: theme.palette.secondary.main + '20',
      borderColor: theme.palette.secondary.main,
      color: theme.palette.secondary.main,
      '&:hover': {
        background: theme.palette.secondary.main + '30',
      },
    }),

    outlined: ({ theme }: { theme: Theme }) => ({
      background: 'transparent',
      borderColor: theme.palette.divider,
      '&:hover': {
        background: theme.palette.action.hover,
      },
    }),

    filled: ({ theme }: { theme: Theme }) => ({
      background: theme.palette.glass.main,
      borderColor: theme.palette.divider,
      '&:hover': {
        background: theme.palette.glass.light,
      },
    }),
  },
}