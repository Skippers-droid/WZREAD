import { invoke } from '@tauri-apps/api/core'
import type {
  Source,
  SourceWithExtensions,
  Comic,
  SaveComicInput,
  UserSettings,
  ChapterImagesResult,
  ReadingProgress,
  SaveReadingProgressInput,
  ReadingHistoryResponse,
  ChapterHistoryEntry,
  DownloadChapterInput,
  DownloadChapterResponse,
} from '~/components'

export function getActiveExtensionIds(source: SourceWithExtensions): string[] {
  if (!source.loaded_extension_ids || !source.loaded_extensions_active) {
    return []
  }
  const ids = source.loaded_extension_ids.split(',')
  const activeStatus = source.loaded_extensions_active.split(',').map((s: string) => parseInt(s))
  return ids.filter((_: string, index: number) => activeStatus[index] === 1)
}

let sourcesCache: SourceWithExtensions[] | null = null
let sourcesCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000

async function getSourcesWithCache(): Promise<SourceWithExtensions[]> {
  const now = Date.now()
  if (sourcesCache && (now - sourcesCacheTime) < CACHE_DURATION) {
    return sourcesCache
  }
  const data = await invoke<SourceWithExtensions[]>('get_sources')
  sourcesCache = data
  sourcesCacheTime = now
  return data
}

function clearSourcesCache() {
  sourcesCache = null
  sourcesCacheTime = 0
}

export const api = {
  sources: {
    getAll: () => getSourcesWithCache(),
    getActive: () => invoke<Source | null>('get_active_source'),
    clearCache: clearSourcesCache,
    save: (data: { source_name: string; source_link?: string; is_active: boolean }) => {
      clearSourcesCache()
      return invoke<Source>('save_source', data)
    },
    setActive: (source_id: number) => {
      clearSourcesCache()
      return invoke<void>('set_active_source', { source_id })
    },
    delete: (id: number) => {
      clearSourcesCache()
      return invoke<void>('delete_source', { id })
    },
    getExtensions: () => {
      clearSourcesCache()
      return invoke<any>('get_source_extensions')
    },
    setActiveExtension: (extension_id: string, is_active: boolean) => {
      clearSourcesCache()
      return invoke<void>('set_active_extension', { extension_id, is_active })
    },
  },

  extension: {
    search: (query_type: string, query?: string, page?: number) => 
      invoke<any>('search_extensions', { query_type, query, page }),
    getMangaInfo: (extension_id: string, book_id: string) =>
      invoke<any>('get_manga_info', { extension_id, book_id }),
    getChapterImages: (
      extension_id: string,
      book_id: string,
      chapter: string,
      page?: number,
      per_page?: number
    ) => invoke<ChapterImagesResult>('get_chapter_images', { extension_id, book_id, chapter, page, per_page }),
    download: (extension_id: string) =>
      invoke<{ success: boolean; worker_id: string; message: string }>('download_extension', { extension_id }),
    getDownloadStatus: (extension_id: string) =>
      invoke<{
        success: boolean
        extension_id: string
        status: string
        progress: number
        message: string
        completed: boolean
        error?: string | null
      }>('get_extension_download_status', { extension_id }),
  },

  comics: {
    getAll: () => invoke<Comic[]>('get_all_comics'),
    save: (data: SaveComicInput) => invoke<Comic>('save_comic', { input: data }),
    get: (extension_id: string, book_id: string) =>
      invoke<Comic | null>('get_comic', { extension_id, book_id }),
    toggleFavorite: (comic_id: number) =>
      invoke<{ comic_id: number; is_favorite: boolean }>('toggle_favorite', { comic_id }),
    delete: (comic_id: number) =>
      invoke<void>('delete_comic', { comic_id }),
  },

  chapters: {
    getCachedImages: (data: DownloadChapterInput) =>
      invoke<{ success: boolean; path?: string; title?: string; comic_title?: string; chapter_number?: number; cached?: boolean; message?: string }>('get_cached_chapter_images', { input: data }),
    download: (data: DownloadChapterInput) =>
      invoke<DownloadChapterResponse>('download_chapter', { input: data }),
    getDownloadStatus: (data: DownloadChapterInput) =>
      invoke<{ downloaded: boolean; chapter_number: number; title: string }>('get_chapter_download_status', { input: data }),
  },

  history: {
    save: (data: { 
      extension_id: string
      book_id: string
      chapter_number: number
      chapter_slug: string
      title?: string
      page_number: number
    }) => invoke<void>('save_reading_history_ext', data),
    get: (extension_id: string, book_id: string) =>
      invoke<ReadingHistoryResponse>('get_reading_history_ext', { extension_id, book_id }),
    getLastRead: (extension_id: string, book_id: string) =>
      invoke<ChapterHistoryEntry | null>('get_last_read_ext', { extension_id, book_id }),
    getChapter: (extension_id: string, book_id: string, chapter_slug: string) =>
      invoke<ChapterHistoryEntry | null>('get_chapter_history_ext', { extension_id, book_id, chapter_slug }),
    deleteChapter: (extension_id: string, book_id: string, chapter_slug: string) =>
      invoke<void>('delete_chapter_history_ext', { extension_id, book_id, chapter_slug }),
    clear: (extension_id: string, book_id: string) =>
      invoke<void>('clear_reading_history_ext', { extension_id, book_id }),
    getAll: () =>
      invoke<any[]>('get_all_reading_history_ext'),
  },

  readingProgress: {
    save: (data: SaveReadingProgressInput) =>
      invoke<void>('save_reading_progress', { input: data }),
    get: (extension_id: string, book_id: string) =>
      invoke<ReadingProgress | null>('get_reading_progress', { extension_id, book_id }),
    getAll: () =>
      invoke<ReadingProgress[]>('get_all_reading_progress'),
    delete: (extension_id: string, book_id: string) =>
      invoke<void>('delete_reading_progress', { extension_id, book_id }),
  },

  settings: {
    getAll: () => invoke<UserSettings>('get_settings'),
    save: (settings: UserSettings) => invoke<void>('save_settings', { settings }),
    getUserAgents: () => invoke<string[]>('get_user_agents'),
    saveUserAgents: (user_agents: string[]) => invoke<void>('save_user_agents', { user_agents }),
    get: (key: string) => invoke<any>('get_setting', { key }),
    set: (key: string, value: any) => invoke<void>('set_setting', { key, value }),
  },
}