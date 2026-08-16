import { ThemeTypography } from '~/main/ipc/types';

export const typography = (customTypography?: ThemeTypography) => {
  const defaultFontFamily = '"Comic Neue", "Inter", "Roboto", "Helvetica", "Arial", sans-serif';
  const defaultHeadingFont = '"Comic Neue", sans-serif';
  
  const fontFamily = customTypography?.fontFamily || defaultFontFamily;
  const headingFont = customTypography?.headingFont || defaultHeadingFont;
  
  return {
    fontFamily: fontFamily,
    
    h1: {
      fontSize: customTypography?.h1?.fontSize || '2.5rem',
      fontWeight: customTypography?.h1?.fontWeight || 600,
      lineHeight: customTypography?.h1?.lineHeight || 1.2,
      fontFamily: customTypography?.h1?.fontFamily || headingFont,
      letterSpacing: customTypography?.h1?.letterSpacing || -0.02,
    },
    
    h2: {
      fontSize: customTypography?.h2?.fontSize || '2rem',
      fontWeight: customTypography?.h2?.fontWeight || 600,
      lineHeight: customTypography?.h2?.lineHeight || 1.3,
      fontFamily: customTypography?.h2?.fontFamily || headingFont,
      letterSpacing: customTypography?.h2?.letterSpacing || -0.01,
    },
    
    h3: {
      fontSize: customTypography?.h3?.fontSize || '1.75rem',
      fontWeight: customTypography?.h3?.fontWeight || 600,
      lineHeight: customTypography?.h3?.lineHeight || 1.3,
      fontFamily: customTypography?.h3?.fontFamily || headingFont,
      letterSpacing: customTypography?.h3?.letterSpacing || 0,
    },
    
    h4: {
      fontSize: customTypography?.h4?.fontSize || '1.5rem',
      fontWeight: customTypography?.h4?.fontWeight || 600,
      lineHeight: customTypography?.h4?.lineHeight || 1.35,
      fontFamily: customTypography?.h4?.fontFamily || headingFont,
      letterSpacing: customTypography?.h4?.letterSpacing || 0,
    },
    
    h5: {
      fontSize: customTypography?.h5?.fontSize || '1.25rem',
      fontWeight: customTypography?.h5?.fontWeight || 600,
      lineHeight: customTypography?.h5?.lineHeight || 1.4,
      fontFamily: customTypography?.h5?.fontFamily || headingFont,
      letterSpacing: customTypography?.h5?.letterSpacing || 0,
    },
    
    h6: {
      fontSize: customTypography?.h6?.fontSize || '1rem',
      fontWeight: customTypography?.h6?.fontWeight || 600,
      lineHeight: customTypography?.h6?.lineHeight || 1.4,
      fontFamily: customTypography?.h6?.fontFamily || headingFont,
      letterSpacing: customTypography?.h6?.letterSpacing || 0,
    },
    
    subtitle1: {
      fontSize: customTypography?.subtitle1?.fontSize || '1rem',
      fontWeight: customTypography?.subtitle1?.fontWeight || 500,
      lineHeight: customTypography?.subtitle1?.lineHeight || 1.5,
      fontFamily: customTypography?.subtitle1?.fontFamily || fontFamily,
      letterSpacing: customTypography?.subtitle1?.letterSpacing || 0,
    },
    
    subtitle2: {
      fontSize: customTypography?.subtitle2?.fontSize || '0.875rem',
      fontWeight: customTypography?.subtitle2?.fontWeight || 500,
      lineHeight: customTypography?.subtitle2?.lineHeight || 1.5,
      fontFamily: customTypography?.subtitle2?.fontFamily || fontFamily,
      letterSpacing: customTypography?.subtitle2?.letterSpacing || 0,
    },
    
    body1: {
      fontSize: customTypography?.body1?.fontSize || '1rem',
      lineHeight: customTypography?.body1?.lineHeight || 1.5,
      fontFamily: customTypography?.body1?.fontFamily || fontFamily,
      letterSpacing: customTypography?.body1?.letterSpacing || 0,
    },
    
    body2: {
      fontSize: customTypography?.body2?.fontSize || '0.875rem',
      lineHeight: customTypography?.body2?.lineHeight || 1.5,
      fontFamily: customTypography?.body2?.fontFamily || fontFamily,
      letterSpacing: customTypography?.body2?.letterSpacing || 0,
    },
    
    button: {
      textTransform: customTypography?.button?.textTransform || 'none' as const,
      fontWeight: customTypography?.button?.fontWeight || 600,
      fontFamily: customTypography?.button?.fontFamily || fontFamily,
      letterSpacing: customTypography?.button?.letterSpacing || 0,
      fontSize: customTypography?.button?.fontSize || '0.875rem',
    },
    
    caption: {
      fontSize: customTypography?.caption?.fontSize || '0.75rem',
      lineHeight: customTypography?.caption?.lineHeight || 1.5,
      fontFamily: customTypography?.caption?.fontFamily || fontFamily,
      letterSpacing: customTypography?.caption?.letterSpacing || 0.02,
    },
    
    overline: {
      fontSize: customTypography?.overline?.fontSize || '0.75rem',
      fontWeight: customTypography?.overline?.fontWeight || 600,
      lineHeight: customTypography?.overline?.lineHeight || 1.5,
      fontFamily: customTypography?.overline?.fontFamily || fontFamily,
      letterSpacing: customTypography?.overline?.letterSpacing || 0.08,
      textTransform: customTypography?.overline?.textTransform || 'uppercase' as const,
    },
  };
};