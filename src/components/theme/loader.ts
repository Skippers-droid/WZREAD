import { Theme } from '~/components';

const THEME_BASE_URL = '/themes';

const defaultThemes: Theme[] = [
  {
    name: 'Light Theme',
    folder: 'light',
    dark_mode: false,
    description: 'Clean and bright light theme',
  },
  {
    name: 'Dark Theme',
    folder: 'dark',
    dark_mode: true,
    description: 'Sleek dark theme with deep blacks',
  },
  {
    name: 'Galaxy Theme',
    folder: 'galaxy',
    dark_mode: true,
    description: 'Deep cosmic blue with vibrant accents',
  },
];

export async function loadThemeFromFile(folder: string): Promise<Theme | null> {
  try {
    const response = await fetch(`${THEME_BASE_URL}/${folder}.json`);
    if (!response.ok) return null;
    const theme = await response.json();
    return theme;
  } catch {
    return null;
  }
}

export async function loadAllThemes(): Promise<Theme[]> {
  const themes: Theme[] = [];
  for (const defaultTheme of defaultThemes) {
    const theme = await loadThemeFromFile(defaultTheme.folder);
    if (theme) {
      themes.push(theme);
    } else {
      themes.push(defaultTheme);
    }
  }
  return themes;
}

export function getDefaultTheme(folder: string): Theme | undefined {
  return defaultThemes.find(t => t.folder === folder);
}

export function getThemeFolderFromPreference(): string {
  const saved = localStorage.getItem('activeTheme');
  if (saved) return saved;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}