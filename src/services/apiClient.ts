import { ApiResponse, Page, PageRequest } from '@/types/common'
import { SELECTED_PROJECT_STORAGE_KEY, SESSION_STORAGE_KEY } from '@/constants/app'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '')

/** Resolve backend-owned file paths such as /uploads/... against the API host. */
export const resolveApiAssetUrl = (value?: string | null): string | null => {
  const path = value?.trim()
  if (!path) return null
  if (/^(?:https?:|data:|blob:)/i.test(path)) return path
  try {
    const apiUrl = new URL(API_BASE_URL, window.location.origin)
    return new URL(path.startsWith('/') ? path : `/${path}`, apiUrl.origin).toString()
  } catch {
    return path
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
}

interface BackendFieldError {
  field?: string
  message?: string
}

const REQUEST_TIMEOUT_MS = 20_000

const clearInvalidSession = () => {
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
  sessionStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY)
}

const getBearerToken = () => {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return undefined
    return (JSON.parse(stored) as { token?: string }).token
  } catch {
    return undefined
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const url = new URL(`${API_BASE_URL}/${path.replace(/^\//, '')}`)
  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  })

  const token = getBearerToken()
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body !== undefined && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  try {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
      body: options.body instanceof FormData ? options.body : options.body === undefined ? undefined : JSON.stringify(options.body),
    })
    window.clearTimeout(timeout)
    const contentType = response.headers.get('content-type') ?? ''
    let payload: unknown
    try {
      payload = contentType.includes('application/json') ? await response.json() : await response.text()
    } catch {
      return fail<T>('The backend returned an invalid response.')
    }
    if (!response.ok) {
      const errorPayload = typeof payload === 'object' && payload ? payload as { message?: unknown; errors?: BackendFieldError[] } : undefined
      const fieldMessage = Array.isArray(errorPayload?.errors)
        ? errorPayload.errors.map((error) => error.message).filter(Boolean).join(' ')
        : ''
      const message = fieldMessage || (errorPayload?.message ? String(errorPayload.message) : `Request failed with status ${response.status}.`)
      if (response.status === 401 && !url.pathname.endsWith('/auth/login')) {
        clearInvalidSession()
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: message }))
        if (window.location.pathname !== '/login') window.location.assign('/login')
      }
      if (response.status === 403 && url.pathname.includes('/projects')) {
        window.dispatchEvent(new CustomEvent('project:forbidden', {
          detail: { message, path: url.pathname, status: response.status },
        }))
      }
      return fail<T>(message)
    }
    if (typeof payload === 'object' && payload && 'success' in payload) {
      const envelope = payload as Partial<ApiResponse<T>>
      return {
        success: Boolean(envelope.success),
        message: envelope.message ? String(envelope.message) : 'OK',
        data: ('data' in envelope ? envelope.data : null) as T,
        timestamp: envelope.timestamp ? String(envelope.timestamp) : new Date().toISOString(),
      }
    }
    return ok(payload as T)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return fail<T>('The backend request timed out. Please try again.')
    return fail<T>('Unable to connect to the backend API. Check that the server is running and try again.')
  }
}

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
