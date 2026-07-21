import { ApiResponse, Page, PageRequest } from '@/types/common'
import { apiRequest, fail, ok } from './apiClient'

type BackendPage<T> = Partial<Page<T>> & {
  number?: number
  size?: number
  content?: T[]
}

const pageQuery = (request: PageRequest) => ({
  pageNumber: request.pageNumber,
  pageSize: request.pageSize,
  sortBy: request.sortBy,
  sortDir: request.sortDir,
  search: request.search?.trim(),
  ...request.filters,
})

export async function getConfigurationPage<T>(
  endpoint: string,
  request: PageRequest,
): Promise<ApiResponse<Page<T>>> {
  const response = await apiRequest<BackendPage<T> | T[]>(endpoint, { query: pageQuery(request) })
  if (!response.success) return fail(response.message)

  if (!Array.isArray(response.data)) {
    return ok({
      content: response.data.content ?? [],
      pageNumber: response.data.pageNumber ?? response.data.number ?? request.pageNumber,
      pageSize: response.data.pageSize ?? response.data.size ?? request.pageSize,
      totalElements: response.data.totalElements ?? response.data.content?.length ?? 0,
      totalPages: response.data.totalPages ?? 1,
    }, response.message)
  }

  const rows = response.data
  const totalElements = rows.length
  const totalPages = Math.max(1, Math.ceil(totalElements / request.pageSize))
  const pageNumber = Math.min(request.pageNumber, totalPages - 1)
  const start = pageNumber * request.pageSize
  return ok({
    content: rows.slice(start, start + request.pageSize),
    pageNumber,
    pageSize: request.pageSize,
    totalElements,
    totalPages,
  }, response.message)
}

/** The supplied controller exposes collection GET only, so edit/detail loads find the id there. */
export async function getConfigurationItem<T extends { id: string }>(
  endpoint: string,
  id: string,
): Promise<ApiResponse<T>> {
  const response = await apiRequest<BackendPage<T> | T[]>(endpoint, {
    query: { pageNumber: 0, pageSize: 1000 },
  })
  if (!response.success) return fail(response.message)
  const rows = Array.isArray(response.data) ? response.data : response.data.content ?? []
  const item = rows.find((row) => String(row.id) === String(id))
  return item ? ok(item, response.message) : fail('Configuration item not found.')
}
