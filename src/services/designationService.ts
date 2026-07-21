import { ApiResponse, Page, PageRequest } from '@/types/common'
import { Designation } from '@/types/auth'
import { CreateDesignationPayload, UpdateDesignationPayload } from '@/types/designation'
import { apiRequest, fail, ok } from './apiClient'

type BackendDesignation = Partial<Designation> & {
  name?: string
  designationName?: string
  employeeCount?: number
  headcount?: number
}

type BackendPage<T> = Partial<Page<T>> & {
  number?: number
  size?: number
  content?: T[]
  items?: T[]
  currentPage?: number
  totalItems?: number
}

const ENDPOINT = '/configuration/designations'
const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ')

const mapDesignation = (item: BackendDesignation): Designation => ({
  id: String(item.id ?? ''),
  title: String(item.title ?? item.name ?? item.designationName ?? ''),
  active: item.active,
  employeeCount: item.employeeCount ?? item.headcount,
})

const mapPage = (source: BackendPage<BackendDesignation> | BackendDesignation[], request: PageRequest): Page<Designation> => {
  if (!Array.isArray(source)) {
    const content = source.content ?? source.items ?? []
    const pageSize = source.pageSize ?? source.size ?? request.pageSize
    const totalElements = source.totalElements ?? source.totalItems ?? content.length
    return {
      content: content.map(mapDesignation),
      pageNumber: source.pageNumber ?? source.number ?? source.currentPage ?? request.pageNumber,
      pageSize,
      totalElements,
      totalPages: source.totalPages ?? Math.max(1, Math.ceil(totalElements / pageSize)),
    }
  }

  let rows = source.map(mapDesignation)
  const search = request.search?.trim().toLowerCase()
  if (search) rows = rows.filter((item) => item.title.toLowerCase().includes(search))
  if (request.sortBy === 'title') {
    const direction = request.sortDir === 'desc' ? -1 : 1
    rows = [...rows].sort((a, b) => a.title.localeCompare(b.title) * direction)
  }
  const totalElements = rows.length
  const totalPages = Math.max(1, Math.ceil(totalElements / request.pageSize))
  const pageNumber = Math.min(request.pageNumber, totalPages - 1)
  const start = pageNumber * request.pageSize
  return {
    content: rows.slice(start, start + request.pageSize),
    pageNumber,
    pageSize: request.pageSize,
    totalElements,
    totalPages,
  }
}

export const designationService = {
  async getDesignations(request: PageRequest): Promise<ApiResponse<Page<Designation>>> {
    const response = await apiRequest<BackendPage<BackendDesignation> | BackendDesignation[]>(ENDPOINT, {
      query: {
        // Spring Pageable uses page/size/sort. Keep the named parameters too
        // for controller implementations that bind a custom page request DTO.
        page: request.pageNumber,
        size: request.pageSize,
        sort: request.sortBy ? `${request.sortBy},${request.sortDir ?? 'asc'}` : undefined,
        pageNumber: request.pageNumber,
        pageSize: request.pageSize,
        sortBy: request.sortBy,
        sortDir: request.sortDir,
        search: request.search?.trim(),
      },
    })
    return response.success
      ? ok(mapPage(response.data, request), response.message)
      : fail(response.message)
  },

  async getDesignationById(id: string): Promise<ApiResponse<Designation>> {
    const response = await apiRequest<BackendDesignation>(`${ENDPOINT}/${encodeURIComponent(id)}`)
    if (response.success) return ok(mapDesignation(response.data), response.message)

    // Some backend versions expose designation reads only through the
    // collection endpoint. Fall back to that real endpoint for edit loading.
    const listResponse = await apiRequest<BackendPage<BackendDesignation> | BackendDesignation[]>(ENDPOINT, {
      query: {
        page: 0,
        size: 1000,
        sort: 'title,asc',
        pageNumber: 0,
        pageSize: 1000,
        sortBy: 'title',
        sortDir: 'asc',
      },
    })
    if (!listResponse.success) return fail(response.message || listResponse.message)
    const rows = Array.isArray(listResponse.data)
      ? listResponse.data
      : listResponse.data.content ?? listResponse.data.items ?? []
    const designation = rows.find((item) => String(item.id) === String(id))
    return designation ? ok(mapDesignation(designation)) : fail('Designation not found.')
  },

  async createDesignation(payload: CreateDesignationPayload): Promise<ApiResponse<Designation>> {
    const title = normalizeName(payload.title)
    if (!title) return fail('Designation Name is required.')
    const response = await apiRequest<BackendDesignation>(ENDPOINT, { method: 'POST', body: { name: title } })
    return response.success ? ok(mapDesignation(response.data), response.message) : fail(response.message)
  },

  async updateDesignation(id: string, payload: UpdateDesignationPayload): Promise<ApiResponse<Designation>> {
    const title = normalizeName(payload.title)
    if (!title) return fail('Designation Name is required.')
    const response = await apiRequest<BackendDesignation>(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'PUT', body: { name: title } })
    return response.success ? ok(mapDesignation(response.data), response.message) : fail(response.message)
  },

  async deleteDesignation(id: string): Promise<ApiResponse<null>> {
    return apiRequest<null>(`${ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}
