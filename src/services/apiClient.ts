import { ApiResponse, Page, PageRequest } from '@/types/common'

/**
 * Simulates real network latency so loading states behave like they would
 * against a live Spring Boot API.
 */
export function mockDelay(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function ok<T>(data: T, message = 'OK'): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  }
}

export function fail<T>(message: string): ApiResponse<T> {
  return {
    success: false,
    message,
    data: null as unknown as T,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Generic in-memory paginator + search + sort, standing in for a
 * `Pageable`-driven Spring Data JPA query. Swap the body of the service
 * function that calls this for a real fetch() when the backend is ready —
 * callers don't need to change.
 */
export function paginate<T extends Record<string, any>>(
  source: T[],
  request: PageRequest,
  searchFields: (keyof T)[] = [],
): Page<T> {
  let rows = source

  if (request.search && request.search.trim().length > 0) {
    const term = request.search.trim().toLowerCase()
    rows = rows.filter((row) =>
      searchFields.some((field) => String(row[field] ?? '').toLowerCase().includes(term)),
    )
  }

  if (request.filters) {
    for (const [key, value] of Object.entries(request.filters)) {
      if (value === undefined || value === '' || value === 'All') continue
      rows = rows.filter((row) => String(row[key]) === String(value))
    }
  }

  if (request.sortBy) {
    const dir = request.sortDir === 'desc' ? -1 : 1
    rows = [...rows].sort((a, b) => {
      const av = a[request.sortBy as string]
      const bv = b[request.sortBy as string]
      if (av === bv) return 0
      return av > bv ? dir : -dir
    })
  }

  const totalElements = rows.length
  const pageSize = request.pageSize || 10
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize))
  const pageNumber = Math.min(Math.max(0, request.pageNumber), totalPages - 1)
  const start = pageNumber * pageSize
  const content = rows.slice(start, start + pageSize)

  return { content, pageNumber, pageSize, totalElements, totalPages }
}
