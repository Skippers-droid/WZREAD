import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '~/components'

interface UseReadingProgressProps {
  comicId: number
  chapterNumber: string
  extensionId: string
  bookId: string
  title?: string
  cover?: string
}

export function useReadingProgress({ comicId, chapterNumber, extensionId, bookId, title }: UseReadingProgressProps) {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(() => {
    const storageKey = `reading_${extensionId}_${bookId}_chapter_${chapterNumber}`
    try {
      const data = localStorage.getItem(storageKey)
      if (data) {
        const parsed = JSON.parse(data)
        if (parsed.page !== undefined && parsed.page > 0) {
          return parsed.page
        }
      }
    } catch (error) {
      console.error('Failed to load initial page from localStorage:', error)
    }
    return 0
  })
  const [currentOffset, setCurrentOffset] = useState(() => {
    const storageKey = `reading_${extensionId}_${bookId}_chapter_${chapterNumber}`
    try {
      const data = localStorage.getItem(storageKey)
      if (data) {
        const parsed = JSON.parse(data)
        if (parsed.offset !== undefined) {
          return parsed.offset
        }
      }
    } catch (error) {
      console.error('Failed to load initial offset from localStorage:', error)
    }
    return 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const saveTimeoutRef = useRef<number | null>(null)
  const lastSavedPageRef = useRef<number>(currentPage)
  const lastSavedOffsetRef = useRef<number>(currentOffset)
  const [isInitialized, setIsInitialized] = useState(false)
  const lastPageUpdateRef = useRef<number>(currentPage)
  const lastOffsetUpdateRef = useRef<number>(currentOffset)

  const storageKey = `reading_${extensionId}_${bookId}_chapter_${chapterNumber}`

  useEffect(() => {
    const savedData = (() => {
      try {
        const data = localStorage.getItem(storageKey)
        if (data) {
          const parsed = JSON.parse(data)
          return parsed
        }
      } catch (error) {
        console.error('Failed to load data from localStorage on reset:', error)
      }
      return null
    })()

    if (savedData) {
      const page = savedData.page !== undefined && savedData.page > 0 ? savedData.page : 0
      const offset = savedData.offset !== undefined ? savedData.offset : 0
      setCurrentPage(page)
      setCurrentOffset(offset)
      lastSavedPageRef.current = page
      lastSavedOffsetRef.current = offset
      lastPageUpdateRef.current = page
      lastOffsetUpdateRef.current = offset
    } else {
      setCurrentPage(0)
      setCurrentOffset(0)
      lastSavedPageRef.current = 0
      lastSavedOffsetRef.current = 0
      lastPageUpdateRef.current = 0
      lastOffsetUpdateRef.current = 0
    }
    setIsInitialized(true)
    setIsLoading(false)
  }, [storageKey])

  const loadPosition = useCallback((): { page: number; offset: number } | null => {
    try {
      const data = localStorage.getItem(storageKey)
      if (data) {
        const parsed = JSON.parse(data)
        return { page: parsed.page || 0, offset: parsed.offset || 0 }
      }
    } catch (error) {
      console.error('Failed to load position from localStorage:', error)
    }
    return null
  }, [storageKey])

  const savePosition = useCallback((page: number, offset: number) => {
    try {
      const position = { page, offset, ts: Date.now() }
      localStorage.setItem(storageKey, JSON.stringify(position))
      lastSavedPageRef.current = page
      lastSavedOffsetRef.current = offset
    } catch (error) {
      console.error('Failed to save position to localStorage:', error)
    }
  }, [storageKey])

  const { data: comicData } = useQuery({
    queryKey: ['comic', extensionId, bookId],
    queryFn: () => api.comics.get(extensionId || '', bookId || ''),
    enabled: !!extensionId && !!bookId,
    staleTime: 5 * 60 * 1000,
  })

  const effectiveComicId = comicData?.id || comicId || 0

  const { data: readingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['readingHistory', effectiveComicId],
    queryFn: () => effectiveComicId ? api.history.get(effectiveComicId) : Promise.resolve(null),
    enabled: !!effectiveComicId,
    staleTime: 5 * 60 * 1000,
  })

  const saveHistoryMutation = useMutation({
    mutationFn: (data: { 
      comic_id: number
      chapter_number: number
      chapter_slug: string
      title?: string
      page_number: number
    }) => {
      return api.history.save(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history', effectiveComicId] })
      refetchHistory()
    },
    onError: (error) => {
      console.error('Failed to save history:', error)
    }
  })

  const getSavedPosition = useCallback((): { page: number; offset: number } => {
    const savedPosition = loadPosition()
    if (savedPosition) {
      return savedPosition
    }

    if (readingHistory?.last_read && readingHistory.last_read.page_number > 0) {
      const page = readingHistory.last_read.page_number
      if (page > 0) {
        const position = { page: page - 1, offset: 0 }
        savePosition(position.page, position.offset)
        return position
      }
    }

    return { page: 0, offset: 0 }
  }, [loadPosition, readingHistory, savePosition])

  useEffect(() => {
    if (isInitialized) {
      const savedPosition = getSavedPosition()
      if (savedPosition.page !== currentPage || savedPosition.offset !== currentOffset) {
        setCurrentPage(savedPosition.page)
        setCurrentOffset(savedPosition.offset)
        lastSavedPageRef.current = savedPosition.page
        lastSavedOffsetRef.current = savedPosition.offset
        lastPageUpdateRef.current = savedPosition.page
        lastOffsetUpdateRef.current = savedPosition.offset
      }
    }
  }, [isInitialized, getSavedPosition, currentPage, currentOffset])

  const updateCurrentPage = useCallback((page: number, offset: number = 0) => {
    if (lastPageUpdateRef.current === page && Math.abs(lastOffsetUpdateRef.current - offset) < 10) {
      return
    }
    
    lastPageUpdateRef.current = page
    lastOffsetUpdateRef.current = offset
    setCurrentPage(page)
    setCurrentOffset(offset)
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    savePosition(page, offset)

    if (effectiveComicId > 0) {
      saveTimeoutRef.current = window.setTimeout(() => {
        if (effectiveComicId && chapterNumber) {
          const pageNumber = page + 1
          const chapterNum = parseInt(chapterNumber)
          const chapterSlug = `chapter-${chapterNumber}`
          const chapterTitle = title || `Chapter ${chapterNumber}`
          
          saveHistoryMutation.mutate({
            comic_id: effectiveComicId,
            chapter_number: chapterNum,
            chapter_slug: chapterSlug,
            title: chapterTitle,
            page_number: pageNumber,
          })
        }
      }, 300)
    }
  }, [savePosition, effectiveComicId, chapterNumber, title, saveHistoryMutation])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    currentPage,
    currentOffset,
    comicId: effectiveComicId,
    comicData,
    updateCurrentPage,
    isLoading,
    isInitialized,
    refetchHistory,
  }
}