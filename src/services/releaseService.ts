import { ApiResponse, Page, PageRequest } from '@/types/common'
import {
  CreateReleasePayload,
  ReleaseOverview,
  ReleaseRecord,
  ReleaseStatus,
  RELEASE_STATUSES,
} from '@/types/release'
import { apiRequest, fail, ok } from './apiClient'

type Json = Record<string, any>
type BackendPage = {
  content?: Json[]
  items?: Json[]
  pageNumber?: number
  pageSize?: number
  number?: number
  size?: number
  totalElements?: number
  totalItems?: number
  totalPages?: number
}

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ')
const isReleaseStatus = (value: string): value is ReleaseStatus =>
  RELEASE_STATUSES.includes(value as ReleaseStatus)
const stringValue = (...values: unknown[]) =>
  String(values.find((value) => value !== undefined && value !== null) ?? '')

const mapRelease = (source: Json, projectId: string): ReleaseRecord => ({
  id: stringValue(source.id, source.releaseId),
  projectId: stringValue(source.projectId, projectId),
  name: stringValue(source.name, source.releaseName),
  version: stringValue(source.version),
  releaseTypeId: stringValue(source.releaseTypeId, source.releaseType?.id),
  releaseTypeName: stringValue(source.releaseTypeName, source.releaseType?.name),
  description: stringValue(source.description),
  releaseDate: stringValue(source.releaseDate),
  status: isReleaseStatus(String(source.status).toUpperCase()) ? String(source.status).toUpperCase() as ReleaseStatus : 'ON_HOLD',
  createdAt: stringValue(source.createdAt),
  updatedAt: stringValue(source.updatedAt, source.createdAt),
})

const pageQuery = (request: PageRequest) => ({
  pageNumber: request.pageNumber,
  pageSize: request.pageSize,
  search: request.search?.trim() || undefined,
  sortBy: request.sortBy,
  sortDir: request.sortDir,
  status: request.filters?.status === 'All' ? undefined : request.filters?.status,
  releaseTypeId: request.filters?.releaseTypeId === 'All' ? undefined : request.filters?.releaseTypeId,
})

export const releaseService = {
  async getReleases(request: PageRequest): Promise<ApiResponse<Page<ReleaseRecord>>> {
    const projectId = stringValue(request.filters?.projectId)
    if (!projectId) return fail('Project is required to load Releases.')
    const response = await apiRequest<BackendPage | Json[]>(
      `/projects/${encodeURIComponent(projectId)}/releases`,
      { query: pageQuery(request) },
    )
    if (!response.success) return fail(response.message)
    const source = response.data
    const allRows = Array.isArray(source) ? source : source.content ?? source.items ?? []
    const pageSize = Array.isArray(source) ? request.pageSize : source.pageSize ?? source.size ?? request.pageSize
    const totalElements = Array.isArray(source) ? allRows.length : source.totalElements ?? source.totalItems ?? allRows.length
    const pageNumber = Array.isArray(source) ? request.pageNumber : source.pageNumber ?? source.number ?? request.pageNumber
    const rows = Array.isArray(source)
      ? allRows.slice(pageNumber * pageSize, pageNumber * pageSize + pageSize)
      : allRows
    return ok({
      content: rows.map((row) => mapRelease(row, projectId)),
      pageNumber,
      pageSize,
      totalElements,
      totalPages: Array.isArray(source)
        ? Math.max(1, Math.ceil(totalElements / pageSize))
        : source.totalPages ?? Math.max(1, Math.ceil(totalElements / pageSize)),
    }, response.message)
  },

  async getReleaseById(projectId: string, releaseId: string): Promise<ApiResponse<ReleaseRecord>> {
    const response = await this.getReleases({
      pageNumber: 0,
      pageSize: 1000,
      filters: { projectId },
    })
    if (!response.success) return fail(response.message)
    const release = response.data.content.find((item) => item.id === String(releaseId))
    return release ? ok(release, response.message) : fail('Release not found.')
  },

  async createRelease(projectId: string, payload: CreateReleasePayload): Promise<ApiResponse<ReleaseRecord>> {
    const response = await apiRequest<Json>(`/projects/${encodeURIComponent(projectId)}/releases`, {
      method: 'POST',
      body: {
        name: normalizeText(payload.name),
        version: normalizeText(payload.version),
        releaseTypeId: payload.releaseTypeId,
        description: payload.description.trim(),
        releaseDate: payload.releaseDate,
        status: 'ON_HOLD',
      },
    })
    if (!response.success) return fail(response.message)
    if (response.data && typeof response.data === 'object') {
      return ok(mapRelease(response.data, projectId), response.message)
    }
    const refreshed = await this.getReleases({ pageNumber: 0, pageSize: 1000, filters: { projectId } })
    if (!refreshed.success) return fail(refreshed.message)
    const created = refreshed.data.content.find((release) =>
      release.name.toLowerCase() === normalizeText(payload.name).toLowerCase() &&
      release.version.toLowerCase() === normalizeText(payload.version).toLowerCase())
    return created ? ok(created, response.message) : fail('Release was created, but its details could not be reloaded.')
  },

  async updateReleaseStatus(projectId: string, releaseId: string, status: ReleaseStatus): Promise<ApiResponse<ReleaseRecord>> {
    if (!isReleaseStatus(status)) return fail('Select a valid Release Status.')
    const response = await apiRequest<Json>(
      `/projects/${encodeURIComponent(projectId)}/releases/${encodeURIComponent(releaseId)}/status`,
      { method: 'PATCH', body: { status } },
    )
    if (!response.success) return fail(response.message)
    if (response.data && typeof response.data === 'object') {
      return ok(mapRelease(response.data, projectId), response.message)
    }
    const refreshed = await this.getReleaseById(projectId, releaseId)
    return refreshed.success ? ok(refreshed.data, response.message) : fail(refreshed.message)
  },

  async getReleaseOverview(projectId: string): Promise<ApiResponse<ReleaseOverview>> {
    const response = await this.getReleases({ pageNumber: 0, pageSize: 1000, filters: { projectId } })
    if (!response.success) return fail(response.message)
    const releases = response.data.content
    const upcoming = releases
      .filter((item) => item.status === 'ON_HOLD')
      .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))[0]
    return ok({
      totalReleases: releases.length,
      activeCount: releases.filter((item) => item.status === 'ACTIVE').length,
      onHoldCount: releases.filter((item) => item.status === 'ON_HOLD').length,
      completedCount: releases.filter((item) => item.status === 'COMPLETED').length,
      activeRelease: releases.find((item) => item.status === 'ACTIVE') ?? null,
      nextRelease: upcoming ?? null,
    }, response.message)
  },
}
