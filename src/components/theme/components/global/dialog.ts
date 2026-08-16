import type { Theme } from '@mui/material/styles'

export const MuiDialog = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      '& .MuiBackdrop-root': {
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
      },

      '& .MuiDialog-paper': {
        animation: 'dialogFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }),

    paper: ({ theme }: { theme: Theme }) => ({
      background: theme.palette.glass.main,
      backdropFilter: 'blur(20px)',
      borderRadius: 20,
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: theme.customShadows.xl,
      overflow: 'hidden',
      transition: 'all 0.2s ease',

      '&.MuiDialog-paperScrollPaper': {
        maxHeight: 'calc(100% - 64px)',
      },

      '&:hover': {
        border: `1px solid ${theme.palette.primary.main}30`,
      },
    }),
  },
}

export const MuiDialogTitle = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      color: theme.palette.text.primary,
      fontSize: '1.25rem',
      fontWeight: 700,
      padding: theme.spacing(3),
      background: theme.palette.glass.light,

      '& .MuiTypography-root': {
        fontWeight: 700,
      },
    }),
  },
}

export const MuiDialogContent = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      color: theme.palette.text.secondary,
      padding: theme.spacing(0, 3),

      '& .MuiDialogContentText-root': {
        color: theme.palette.text.secondary,
        lineHeight: 1.6,
        margin: 0,
      },

      '&:first-of-type': {
        paddingTop: theme.spacing(1),
      },
    }),
  },
}

export const MuiDialogContentText = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      color: theme.palette.text.secondary,
      fontSize: '0.9375rem',
      lineHeight: 1.6,
    }),
  },
}

export const MuiDialogActions = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      padding: theme.spacing(3),
      gap: theme.spacing(1.5),

      '& .MuiButton-root': {
        minWidth: 100,
        padding: '8px 20px',
        borderRadius: 12,
        fontWeight: 600,
        transition: 'all 0.2s ease',
      },
    }),
  },
}