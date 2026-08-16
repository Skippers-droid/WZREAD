export interface Source {
  id: number
  source_name: string
  source_link: string
  source_cover: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SourceWithExtensions extends Source {
  loaded_extensions: string | null
  loaded_extensions_active: string | null
  loaded_extension_ids: string | null
}

export interface Comic {
  id: number
  extension_id: string
  book_id: string
  slug: string
  title: string
  alt_title: string | null
  author: string | null
  description: string | null
  cover: string | null
  status: string | null
  type_: string | null
  favorite: boolean
  last_read: string | null
  created_at: string
  updated_at: string
}

export interface SaveComicInput {
  extension_id: string
  book_id: string
  slug: string
  title: string
  alt_title?: string
  author?: string
  description?: string
  cover?: string
  status?: string
  type?: string
  favorite?: boolean
}

export interface ChapterHistoryEntry {
  chapter_number: number
  chapter_slug: string
  title: string | null
  page_number: number
  read_at: string
}

export interface ReadingHistoryResponse {
  history: Record<string, ChapterHistoryEntry>
  last_read: ChapterHistoryEntry | null
  total_chapters: number
}

export interface UserSettings {
  user_agents: string[]
  [key: string]: any
}

export interface ChapterImagesResult {
  images: string[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface DownloadChapterInput {
  extension_id: string
  source_link: string
  book_id: string
  chapter_number: number
  chapter_slug: string
  chapter_title?: string
  comic_title: string
  comic_id: number
}

export interface DownloadChapterResponse {
  success: boolean
  path: string
  title: string
  comic_title: string
  chapter_number: number
  page_count?: number
  already_downloaded?: boolean
}

export interface ThemeColors {
  primary?: string
  primary_light?: string
  primary_dark?: string
  secondary?: string
  secondary_light?: string
  secondary_dark?: string
  error?: string
  error_light?: string
  error_dark?: string
  warning?: string
  warning_light?: string
  warning_dark?: string
  info?: string
  info_light?: string
  info_dark?: string
  success?: string
  success_light?: string
  success_dark?: string
  background?: string
  surface?: string
  elevated?: string
  text?: string
  text_secondary?: string
  text_disabled?: string
  action_active?: string
  action_hover?: string
  action_selected?: string
  action_disabled?: string
  action_disabled_background?: string
  action_focus?: string
  divider?: string
  accent?: string
  accent_light?: string
  accent_dark?: string
  glass?: string
  glass_light?: string
  glass_dark?: string
}

export interface ThemeShadows {
  sm?: string
  md?: string
  lg?: string
  xl?: string
  glass?: string
  neon?: string
}

export interface ThemeTypography {
  font_family?: string
  heading_font?: string
  h1?: TypographyStyle
  h2?: TypographyStyle
  h3?: TypographyStyle
  h4?: TypographyStyle
  h5?: TypographyStyle
  h6?: TypographyStyle
  subtitle1?: TypographyStyle
  subtitle2?: TypographyStyle
  body1?: TypographyStyle
  body2?: TypographyStyle
  button?: TypographyStyle
  caption?: TypographyStyle
  overline?: TypographyStyle
}

export interface TypographyStyle {
  font_size?: string
  font_weight?: number
  line_height?: number
  font_family?: string
  letter_spacing?: number
  text_transform?: string
}

export interface Theme {
  name: string
  folder: string
  dark_mode: boolean
  description?: string
  colors?: ThemeColors
  shadows?: ThemeShadows
  typography?: ThemeTypography
}

export interface ReadingProgress {
  id: number
  extension_id: string
  book_id: string
  chapter_number: number
  chapter_slug: string
  page_number: number
  title: string | null
  cover: string | null
  last_read_at: string
}

export interface SaveReadingProgressInput {
  extension_id: string
  book_id: string
  chapter_number: number
  chapter_slug: string
  page_number: number
  title?: string
  cover?: string
}