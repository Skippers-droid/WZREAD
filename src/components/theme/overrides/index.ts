import { createTheme } from '@mui/material/styles';
import { getPalette } from './palette';
import { getCustomShadows } from './shadows';
import { breakpoints } from './breakpoints';
import { typography } from './typography';
import { components } from '../components';
import { ThemeColors, ThemeShadows, ThemeTypography } from '~/components';

export const createCustomTheme = (
  mode: 'light' | 'dark', 
  customColors?: ThemeColors,
  customShadows?: ThemeShadows,
  customTypography?: ThemeTypography
) => {
  const baseTheme = createTheme({
    breakpoints,
    palette: getPalette(mode, customColors),
    typography: typography(customTypography),
    shape: {
      borderRadius: 12,
    },
    components,
  });

  return {
    ...baseTheme,
    customShadows: getCustomShadows(mode, customShadows),
  };
};