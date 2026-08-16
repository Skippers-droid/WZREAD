import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '~/components'
import type { DownloadChapterInput, DownloadChapterResponse, ChapterImagesResult } from '~/components'

interface UseChapterImagesProps {
  extensionId: string
  bookId: string
  chapterNumber: string
  chapterSlug: string
  chapterTitle?: string
  comicTitle: string
  comicId: number
  sourceLink: string
  perPage?: number
}

export function useChapterImages({ 
  extensionId, 
  bookId, 
  chapterNumber, 
  chapterSlug,
  chapterTitle,
  comicTitle,
  comicId,
  sourceLink,
  perPage = 50 
}: UseChapterImagesProps) {
  const [allImages, setAllImages] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalImages, setTotalImages] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isDownloaded, setIsDownloaded] = useState(false)

  const downloadInput: DownloadChapterInput = {
    extension_id: extensionId,
    source_link: sourceLink,
    book_id: bookId,
    chapter_number: parseInt(chapterNumber),
    chapter_slug: chapterSlug,
    chapter_title: chapterTitle,
    comic_title: comicTitle,
    comic_id: comicId,
  }

  // Fix: Call the function to get the status
  const { data: downloadStatus } = useQuery({
    queryKey: ['downloadStatus', comicId, chapterNumber],
    queryFn: () => api.chapters.getDownloadStatus(downloadInput),
    enabled: !!extensionId && !!bookId && !!chapterNumber && !!comicId,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (downloadStatus) {
      setIsDownloaded(downloadStatus.downloaded)
    }
  }, [downloadStatus])

  const { data: cachedData } = useQuery({
    queryKey: ['cachedImages', comicId, chapterNumber],
    queryFn: () => api.chapters.getCachedImages(downloadInput),
    enabled: !!extensionId && !!bookId && !!chapterNumber && !!comicId,
    staleTime: 5 * 60 * 1000,
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['chapterImages', extensionId, bookId, chapterNumber, page, perPage],
    queryFn: () => {
      if (cachedData?.success && cachedData?.cached) {
        return { images: [], total: 0, page: 1, per_page: perPage, has_more: false, cached: true }
      }
      return api.extension.getChapterImages(
        extensionId,
        bookId,
        chapterNumber,
        page,
        perPage
      )
    },
    enabled: !!extensionId && !!bookId && !!chapterNumber && !cachedData?.cached,
    staleTime: 5 * 60 * 1000,
  })

  const downloadChapter = useCallback(async (): Promise<DownloadChapterResponse> => {
    return api.chapters.download(downloadInput)
  }, [downloadInput])

  useEffect(() => {
    setPage(1)
    setAllImages([])
  }, [extensionId, bookId, chapterNumber])

  useEffect(() => {
    if (data) {
      const result = data as ChapterImagesResult
      if (result && result.images && Array.isArray(result.images)) {
        if (page === 1) {
          setAllImages(result.images)
        } else {
          setAllImages(prev => [...prev, ...result.images])
        }
        setTotalImages(result.total || 0)
        setHasMore(result.has_more || false)
      }
    }
  }, [data, page])

  const loadMoreImages = useCallback(() => {
    if (!hasMore || isLoading) return
    const nextPage = page + 1
    setPage(nextPage)
  }, [hasMore, isLoading, page])

  if (cachedData?.success && cachedData?.cached) {
    return {
      images: [],
      totalImages: 0,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      error: null,
      loadMoreImages: () => {},
      refetch,
      isDownloaded,
      downloadChapter,
      isCached: true,
      cachePath: cachedData.path,
    }
  }

  return {
    images: allImages,
    totalImages,
    hasMore,
    isLoading,
    isLoadingMore: false,
    error: error as Error | null,
    loadMoreImages,
    refetch,
    isDownloaded,
    downloadChapter,
    isCached: false,
    cachePath: null,
  }
}