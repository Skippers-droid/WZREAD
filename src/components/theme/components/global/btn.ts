import type { Theme } from '@mui/material/styles';

export const MuiButton = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      borderRadius: '8px',
      textTransform: 'none' as const,
      fontWeight: 600,
      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease, border-color 0.2s ease',
      padding: '6px 16px',
      position: 'relative' as const,
      overflow: 'hidden',
      willChange: 'transform',
      color: theme.palette.text.primary,
      '&:hover': {
        transform: 'translateY(-2px)',
      },
      '&:active': {
        transform: 'translateY(0) scale(0.98)',
      },
    }),
    sizeSmall: {
      padding: '4px 12px',
      fontSize: '0.8125rem',
    },
    sizeLarge: {
      padding: '8px 22px',
      fontSize: '0.9375rem',
    },
    contained: ({ theme }: { theme: Theme }) => ({
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      boxShadow: theme.customShadows?.sm || '0 2px 8px rgba(0,0,0,0.08)',
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        boxShadow: theme.customShadows?.md || '0 8px 24px rgba(0,0,0,0.12)',
        transform: 'translateY(-2px)',
      },
      '&:active': {
        transform: 'translateY(0) scale(0.98)',
      },
      '&.Mui-disabled': {
        backgroundColor: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
        transform: 'none',
      },
    }),
    containedSecondary: ({ theme }: { theme: Theme }) => ({
      backgroundColor: theme.palette.secondary.main,
      color: theme.palette.secondary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.secondary.dark,
        transform: 'translateY(-2px)',
      },
    }),
    outlined: ({ theme }: { theme: Theme }) => ({
      borderColor: theme.palette.divider,
      color: theme.palette.text.primary,
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: `${theme.palette.primary.main}0f`,
        borderColor: theme.palette.primary.main,
        transform: 'translateY(-2px)',
      },
      '&:active': {
        transform: 'translateY(0) scale(0.98)',
      },
      '&.Mui-disabled': {
        borderColor: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
        transform: 'none',
      },
    }),
    text: ({ theme }: { theme: Theme }) => ({
      color: theme.palette.text.primary,
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: `${theme.palette.primary.main}0f`,
        transform: 'translateY(-2px)',
      },
      '&:active': {
        transform: 'translateY(0) scale(0.98)',
      },
      '&.Mui-disabled': {
        color: theme.palette.action.disabled,
        transform: 'none',
      },
    }),
  },
};

export const MuiIconButton = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      borderRadius: '50%',
      color: theme.palette.text.primary,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        backgroundColor: `${theme.palette.primary.main}0f`,
        transform: 'scale(1.05)',
      },
      '&:active': {
        transform: 'scale(0.95)',
      },
      '&.Mui-disabled': {
        color: theme.palette.action.disabled,
      },
    }),
    colorPrimary: ({ theme }: { theme: Theme }) => ({
      color: theme.palette.primary.main,
      '&:hover': {
        backgroundColor: `${theme.palette.primary.main}15`,
      },
    }),
    colorSecondary: ({ theme }: { theme: Theme }) => ({
      color: theme.palette.secondary.main,
      '&:hover': {
        backgroundColor: `${theme.palette.secondary.main}15`,
      },
    }),
    colorError: ({ theme }: { theme: Theme }) => ({
      color: theme.palette.error.main,
      '&:hover': {
        backgroundColor: `${theme.palette.error.main}15`,
      },
    }),
    colorSuccess: ({ theme }: { theme: Theme }) => ({
      color: theme.palette.success.main,
      '&:hover': {
        backgroundColor: `${theme.palette.success.main}15`,
      },
    }),
    colorWarning: ({ theme }: { theme: Theme }) => ({
      color: theme.palette.warning.main,
      '&:hover': {
        backgroundColor: `${theme.palette.warning.main}15`,
      },
    }),
    colorInfo: ({ theme }: { theme: Theme }) => ({
      color: theme.palette.info.main,
      '&:hover': {
        backgroundColor: `${theme.palette.info.main}15`,
      },
    }),
    sizeSmall: {
      padding: 6,
      '& .MuiSvgIcon-root': {
        fontSize: '1.25rem',
      },
    },
    sizeMedium: {
      padding: 8,
      '& .MuiSvgIcon-root': {
        fontSize: '1.5rem',
      },
    },
    sizeLarge: {
      padding: 12,
      '& .MuiSvgIcon-root': {
        fontSize: '1.75rem',
      },
    },
  },
};

export const MuiToggleButton = {
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      borderRadius: '8px',
      padding: '8px 16px',
      color: theme.palette.text.secondary,
      borderColor: theme.palette.divider,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      textTransform: 'none' as const,
      fontWeight: 500,
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: `${theme.palette.primary.main}0f`,
        transform: 'translateY(-1px)',
        borderColor: theme.palette.primary.main,
      },
      '&:active': {
        transform: 'scale(0.98)',
      },
      '&.Mui-selected': {
        color: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}1a`,
        borderColor: theme.palette.primary.main,
        '&:hover': {
          backgroundColor: `${theme.palette.primary.main}2a`,
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
      },
      '&.Mui-disabled': {
        color: theme.palette.action.disabled,
        borderColor: theme.palette.action.disabledBackground,
      },
    }),
    sizeSmall: {
      padding: '4px 10px',
      fontSize: '0.8125rem',
    },
    sizeLarge: {
      padding: '10px 20px',
      fontSize: '0.9375rem',
    },
  },
};