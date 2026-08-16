import { ThemeColors } from '~/components';

export const getPalette = (mode: 'light' | 'dark', customColors?: ThemeColors) => {
  const isDark = mode === 'dark';
  
  const colors = customColors || {
    primary: isDark ? '#90caf9' : '#1976d2',
    primary_light: isDark ? '#e3f2fd' : '#42a5f5',
    primary_dark: isDark ? '#42a5f5' : '#1565c0',
    secondary: isDark ? '#ce93d8' : '#9c27b0',
    secondary_light: isDark ? '#f3e5f5' : '#ba68c8',
    secondary_dark: isDark ? '#ab47bc' : '#7b1fa2',
    error: isDark ? '#f44336' : '#d32f2f',
    error_light: isDark ? '#ef9a9a' : '#e57373',
    error_dark: isDark ? '#d32f2f' : '#c62828',
    warning: isDark ? '#ffa726' : '#ed6c02',
    warning_light: isDark ? '#ffb74d' : '#ff9800',
    warning_dark: isDark ? '#f57c00' : '#e65100',
    info: isDark ? '#29b6f6' : '#0288d1',
    info_light: isDark ? '#4fc3f7' : '#03a9f4',
    info_dark: isDark ? '#0288d1' : '#01579b',
    success: isDark ? '#66bb6a' : '#2e7d32',
    success_light: isDark ? '#81c784' : '#4caf50',
    success_dark: isDark ? '#388e3c' : '#1b5e20',
    background: isDark ? '#0d0d0d' : '#fafafa',
    surface: isDark ? '#1a1a1a' : '#ffffff',
    elevated: isDark ? '#242424' : '#f5f5f5',
    text: isDark ? '#ffffff' : '#1a1a1a',
    text_secondary: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    text_disabled: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.38)',
    action_active: isDark ? '#ffffff' : 'rgba(0, 0, 0, 0.54)',
    action_hover: isDark ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.08)',
    action_selected: isDark ? 'rgba(144, 202, 249, 0.16)' : 'rgba(25, 118, 210, 0.12)',
    action_disabled: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
    action_disabled_background: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    action_focus: isDark ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.12)',
    divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    accent: isDark ? '#ff4081' : '#e91e63',
    accent_light: isDark ? '#ff80ab' : '#f06292',
    accent_dark: isDark ? '#f50057' : '#c2185b',
    glass: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    glass_light: isDark ? 'rgba(30, 30, 30, 0.6)' : 'rgba(255, 255, 255, 0.6)',
    glass_dark: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  };
  
  const ensureColor = (color: any): string => {
    if (typeof color === 'string' && color) return color;
    return isDark ? '#ffffff' : '#000000';
  };
  
  const getContrastText = (bgColor: string): string => {
    if (!bgColor) return isDark ? '#000000' : '#ffffff';
    
    if (bgColor.startsWith('rgba')) {
      const matches = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (matches) {
        const r = parseInt(matches[1]);
        const g = parseInt(matches[2]);
        const b = parseInt(matches[3]);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
      }
    }
    
    if (bgColor.startsWith('#')) {
      const hex = bgColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? '#000000' : '#ffffff';
    }
    
    return isDark ? '#000000' : '#ffffff';
  };
  
  const primaryMain = ensureColor(colors.primary);
  const primaryDark = ensureColor(colors.primary_dark || colors.primary);
  const primaryLight = ensureColor(colors.primary_light || colors.primary);
  const secondaryMain = ensureColor(colors.secondary);
  const secondaryDark = ensureColor(colors.secondary_dark || colors.secondary);
  const secondaryLight = ensureColor(colors.secondary_light || colors.secondary);
  const errorMain = ensureColor(colors.error);
  const errorDark = ensureColor(colors.error_dark || colors.error);
  const errorLight = ensureColor(colors.error_light || colors.error);
  const warningMain = ensureColor(colors.warning);
  const warningDark = ensureColor(colors.warning_dark || colors.warning);
  const warningLight = ensureColor(colors.warning_light || colors.warning);
  const infoMain = ensureColor(colors.info);
  const infoDark = ensureColor(colors.info_dark || colors.info);
  const infoLight = ensureColor(colors.info_light || colors.info);
  const successMain = ensureColor(colors.success);
  const successDark = ensureColor(colors.success_dark || colors.success);
  const successLight = ensureColor(colors.success_light || colors.success);
  const accentMain = ensureColor(colors.accent || colors.secondary);
  const accentDark = ensureColor(colors.accent_dark || colors.secondary_dark || colors.secondary);
  const accentLight = ensureColor(colors.accent_light || colors.secondary_light || colors.secondary);
  
  return {
    mode,
    primary: {
      main: primaryMain,
      light: primaryLight,
      dark: primaryDark,
      contrastText: getContrastText(primaryMain),
    },
    secondary: {
      main: secondaryMain,
      light: secondaryLight,
      dark: secondaryDark,
      contrastText: getContrastText(secondaryMain),
    },
    error: {
      main: errorMain,
      light: errorLight,
      dark: errorDark,
      contrastText: getContrastText(errorMain),
    },
    warning: {
      main: warningMain,
      light: warningLight,
      dark: warningDark,
      contrastText: getContrastText(warningMain),
    },
    info: {
      main: infoMain,
      light: infoLight,
      dark: infoDark,
      contrastText: getContrastText(infoMain),
    },
    success: {
      main: successMain,
      light: successLight,
      dark: successDark,
      contrastText: getContrastText(successMain),
    },
    background: {
      default: ensureColor(colors.background),
      paper: ensureColor(colors.surface),
      elevated: ensureColor(colors.elevated || colors.surface),
    },
    text: {
      primary: ensureColor(colors.text),
      secondary: ensureColor(colors.text_secondary || (isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)')),
      disabled: ensureColor(colors.text_disabled || (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.38)')),
    },
    action: {
      active: ensureColor(colors.action_active || colors.text),
      hover: ensureColor(colors.action_hover || (isDark ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.08)')),
      selected: ensureColor(colors.action_selected || (isDark ? 'rgba(144, 202, 249, 0.16)' : 'rgba(25, 118, 210, 0.12)')),
      disabled: ensureColor(colors.action_disabled || (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)')),
      disabledBackground: ensureColor(colors.action_disabled_background || (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)')),
      focus: ensureColor(colors.action_focus || (isDark ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.12)')),
    },
    divider: ensureColor(colors.divider || (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)')),
    accent: {
      main: accentMain,
      light: accentLight,
      dark: accentDark,
      contrastText: getContrastText(accentMain),
    },
    glass: {
      main: ensureColor(colors.glass || (isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)')),
      light: ensureColor(colors.glass_light || colors.glass || (isDark ? 'rgba(30, 30, 30, 0.6)' : 'rgba(255, 255, 255, 0.6)')),
      dark: ensureColor(colors.glass_dark || colors.glass || (isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)')),
    },
  };
};