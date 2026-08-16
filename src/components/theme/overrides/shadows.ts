import { ThemeShadows } from '~/main/ipc/types';

export const getCustomShadows = (mode: 'light' | 'dark', customShadows?: ThemeShadows) => {
  const isDark = mode === 'dark';
  
  const shadows = customShadows || {
    sm: isDark 
      ? '0 2px 4px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 2px 4px rgba(0,0,0,0.08)',
    md: isDark
      ? '0 4px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 4px 8px rgba(0,0,0,0.1)',
    lg: isDark
      ? '0 8px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 8px 16px rgba(0,0,0,0.12)',
    xl: isDark
      ? '0 12px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 12px 24px rgba(0,0,0,0.16)',
    glass: isDark
      ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)'
      : '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.8)',
    neon: `0 0 10px ${isDark ? '#90caf9' : '#1976d2'}, 0 0 20px ${isDark ? 'rgba(144, 202, 249, 0.5)' : 'rgba(25, 118, 210, 0.5)'}`,
  };
  
  return {
    sm: shadows.sm,
    md: shadows.md,
    lg: shadows.lg,
    xl: shadows.xl,
    glass: shadows.glass,
    neon: shadows.neon,
  };
};