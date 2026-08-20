import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '~/components'

interface FilterParams {
  status: string
  type: string
  order: string
  search: string
}

interface UseExtensionContentProps {
  extensionId: string | undefined
}

function decodeHtmlEntities(text: string): string {
  if (!text) return text
  
  const entities: { [key: string]: string } = {
    '&quot;': '"',
    '&#34;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&amp;': '&',
    '&#38;': '&',
    '&lt;': '<',
    '&#60;': '<',
    '&gt;': '>',
    '&#62;': '>',
    '&nbsp;': ' ',
    '&#160;': ' ',
    '&#8220;': '"',
    '&#8221;': '"',
    '&#8216;': "'",
    '&#8217;': "'",
    '&#8230;': '...',
  }
  
  let decoded = text
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char)
  }
  
  return decoded
}

function sanitizeText(text: string): string {
  if (!text) return text
  return decodeHtmlEntities(text)
}

function sanitizeItem(item: any): any {
  if (!item) return item
  
  const sanitized = { ...item }
  
  const stringFields = ['title', 'author', 'description', 'status', 'type', 'altTitle', 'name']
  for (const field of stringFields) {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeText(sanitized[field])
    }
  }
  
  if (sanitized.chapters && Array.isArray(sanitized.chapters)) {
    sanitized.chapters = sanitized.chapters.map((chapter: any) => {
      const sanitizedChapter = { ...chapter }
      if (sanitizedChapter.title) {
        sanitizedChapter.title = sanitizeText(sanitizedChapter.title)
      }
      return sanitizedChapter
    })
  }
  
  return sanitized
}

export function useExtensionContent({ extensionId }: UseExtensionContentProps) {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<'popular' | 'latest' | 'filtered'>('popular')
  const [items, setItems] = useState<any[]>([])
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [sourceExtensions, setSourceExtensions] = useState<any>(null)
  const [sourceLoading, setSourceLoading] = useState(true)
  const [filterParams, setFilterParams] = useState<FilterParams>({
    status: '',
    type: '',
    order: '',
    search: '',
  })
  const [appliedFilters, setAppliedFilters] = useState<FilterParams>({
    status: '',
    type: '',
    order: '',
    search: '',
  })
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    const loadExtensions = async () => {
      try {
        const result = await api.sources.getExtensions()
        setSourceExtensions(result)
      } catch (error) {
        console.error('Failed to load extensions:', error)
      } finally {
        setSourceLoading(false)
      }
    }
    loadExtensions()
  }, [])

  const extensionInfo = useMemo(() => 
    sourceExtensions?.extensions?.find(
      (ext: any) => ext.id?.toLowerCase() === extensionId?.toLowerCase()
    ),
    [sourceExtensions, extensionId]
  )

  const buildFilterQuery = (params: FilterParams): string => {
    const parts: string[] = []
    if (params.search) parts.push(`search=${encodeURIComponent(params.search)}`)
    if (params.status) parts.push(`status=${encodeURIComponent(params.status)}`)
    if (params.type) parts.push(`type=${encodeURIComponent(params.type)}`)
    if (params.order) parts.push(`order=${encodeURIComponent(params.order)}`)
    return parts.join('&')
  }

  const fetchExtensionData = useCallback(async (mode: string, filters: FilterParams, pageNum?: number) => {
    if (!extensionId) return null
    
    let queryType = 'search'
    let queryParam = ''
    let page = pageNum || 1
    
    if (mode === 'popular') {
      queryType = 'popular'
      queryParam = 'day'
    } else if (mode === 'latest') {
      queryType = 'latest'
      page = pageNum || 1
    } else {
      queryType = 'filtered'
      queryParam = buildFilterQuery(filters)
    }
    
    const result = await api.extension.search(queryType, queryParam || undefined, mode === 'latest' ? page : undefined)
    
    if (result && typeof result === 'object') {
      let extensionData = null
      
      if (extensionId && result[extensionId]) {
        extensionData = result[extensionId]
      } else {
        const keys = Object.keys(result)
        for (const key of keys) {
          if (result[key] && result[key].data && Array.isArray(result[key].data)) {
            extensionData = result[key]
            break
          }
        }
      }
      
      if (extensionData && extensionData.data && Array.isArray(extensionData.data)) {
        const sanitizedData = extensionData.data.map(sanitizeItem)
        return {
          data: sanitizedData,
          total: extensionData.total || sanitizedData.length,
          page: extensionData.page || page,
          per_page: extensionData.per_page || sanitizedData.length,
          has_more: extensionData.has_more || false
        }
      }
    }
    
    return { data: [], total: 0, page: 1, per_page: 0, has_more: false }
  }, [extensionId])

  const { data: searchData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['extensionSearch', extensionId, viewMode, appliedFilters],
    queryFn: async () => {
      return fetchExtensionData(viewMode, appliedFilters)
    },
    enabled: !!extensionInfo && !!extensionId,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  })

  useEffect(() => {
    if (searchData && !isFetching) {
      setItems(searchData.data || [])
    }
  }, [searchData, isFetching])

  const handleViewChange = useCallback((newMode: 'popular' | 'latest' | 'filtered') => {
    if (newMode === viewMode) return
    setViewMode(newMode)
    if (newMode === 'filtered') {
      setFilterDialogOpen(true)
    } else {
      setAppliedFilters({ status: '', type: '', order: '', search: '' })
      setFilterParams({ status: '', type: '', order: '', search: '' })
    }
  }, [viewMode])

  const handleFilterApply = useCallback(() => {
    setIsApplying(true)
    setAppliedFilters({ ...filterParams })
    setViewMode('filtered')
    setFilterDialogOpen(false)
    setTimeout(() => {
      setIsApplying(false)
    }, 200)
  }, [filterParams])

  const handleFilterReset = useCallback(() => {
    setIsApplying(true)
    const resetParams = {
      status: '',
      type: '',
      order: '',
      search: '',
    }
    setFilterParams(resetParams)
    setAppliedFilters(resetParams)
    setViewMode('popular')
    setFilterDialogOpen(false)
    setTimeout(() => {
      setIsApplying(false)
    }, 200)
  }, [])

  const updateFilterParams = useCallback((key: keyof FilterParams, value: string) => {
    setFilterParams(prev => ({ ...prev, [key]: value }))
  }, [])

  const loadMore = useCallback(async () => {
    if (searchData?.has_more && !isLoading && !isFetching) {
      const nextPage = (searchData.page || 1) + 1
      const result = await fetchExtensionData(viewMode, appliedFilters, nextPage)
      
      if (result && result.data && result.data.length > 0) {
        setItems(prev => [...prev, ...result.data])
        // Update the cached data with the new total
        queryClient.setQueryData(
          ['extensionSearch', extensionId, viewMode, appliedFilters],
          (old: any) => ({
            ...old,
            data: [...(old?.data || []), ...result.data],
            total: result.total,
            page: result.page,
            has_more: result.has_more
          })
        )
      }
    }
  }, [searchData, isLoading, isFetching, extensionId, viewMode, appliedFilters, queryClient, fetchExtensionData])

  return {
    items,
    isLoading: isLoading || isFetching || isApplying,
    sourceLoading,
    extensionInfo,
    extensionId,
    viewMode,
    filterDialogOpen,
    filterParams,
    handleViewChange,
    handleFilterApply,
    handleFilterReset,
    updateFilterParams,
    setFilterDialogOpen,
    loadMore,
    hasMore: searchData?.has_more || false,
    total: searchData?.total || 0,
  }
}