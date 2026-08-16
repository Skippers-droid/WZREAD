import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xxl: true;
  }

  interface Palette {
    accent: Palette['primary'];
    glass: {
      main: string;
      light: string;
      dark: string;
    };
  }

  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
    glass?: {
      main: string;
      light: string;
      dark: string;
    };
  }

  interface Theme {
    customShadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      glass: string;
      neon: string;
    };
  }

  interface ThemeOptions {
    customShadows?: {
      sm?: string;
      md?: string;
      lg?: string;
      xl?: string;
      glass?: string;
      neon?: string;
    };
  }
}