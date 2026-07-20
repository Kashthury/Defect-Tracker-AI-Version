import { useCallback, useEffect, useState } from 'react'
import { ApiResponse, Page, PageRequest, PageSizeOption } from '@/types/common'
import { DEFAULT_PAGE_SIZE } from '@/constants/app'

interface UsePaginationOptions<T> {
  fetcher: (request: PageRequest) => Promise<ApiResponse<Page<T>>>
  initialPageSize?: PageSizeOption
  initialSortBy?: string
  initialSortDir?: 'asc' | 'desc'
  filters?: Record<string, string | number | boolean | undefined>
  enabled?: boolean
}

/**
 * Drives any Table + Pagination combo against a backend-style paginated
 * service. Only `fetcher` needs to change when swapping mocks for real
 * Spring Boot endpoints.
 */
export function usePagination<T>({
  fetcher,
  initialPageSize = DEFAULT_PAGE_SIZE,
  initialSortBy,
  initialSortDir = 'asc',
  filters,
  enabled = true,
}: UsePaginationOptions<T>) {
  const [pageNumber, setPageNumber] = useState(0)
  const [pageSize, setPageSize] = useState<PageSizeOption>(initialPageSize)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState(initialSortBy)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDir)
  const [page, setPage] = useState<Page<T> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!enabled) {
      setPage(null)
      setIsLoading(false)
      setError(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetcher({ pageNumber, pageSize, search, sortBy, sortDir, filters })
      if (response.success) {
        setPage(response.data)
      } else {
        setError(response.message)
      }
    } catch (e) {
      setError('Something went wrong while loading data.')
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetcher, pageNumber, pageSize, search, sortBy, sortDir, JSON.stringify(filters)])

  useEffect(() => {
    load()
  }, [load])

  // Reset to first page whenever the search term or filters change.
  useEffect(() => {
    setPageNumber(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, JSON.stringify(filters)])

  return {
    page,
    isLoading,
    error,
    pageNumber,
    pageSize,
    search,
    sortBy,
    sortDir,
    setPageNumber,
    setPageSize,
    setSearch,
    setSortBy,
    setSortDir,
    reload: load,
  }
}
