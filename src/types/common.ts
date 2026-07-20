/**
 * Generic API envelope, shaped to match a future Spring Boot response body.
 */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

/**
 * Spring Data-style page response.
 */
export interface Page<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
}

export interface PageRequest {
  pageNumber: number
  pageSize: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  search?: string
  filters?: Record<string, string | number | boolean | undefined>
}

export type PageSizeOption = 10 | 25 | 50 | 100

export interface SelectOption {
  label: string
  value: string
}

export type BadgeTone = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'neutral' | 'success'
