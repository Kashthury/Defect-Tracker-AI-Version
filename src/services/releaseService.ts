import { mockReleaseTypes } from '@/mock/configuration'
import { mockProjects } from '@/mock/projects'
import { mockReleases } from '@/mock/releases'
import { ApiResponse, Page, PageRequest } from '@/types/common'
import {
  CreateReleasePayload,
  ReleaseOverview,
  ReleaseRecord,
  ReleaseStatus,
  RELEASE_STATUSES,
  UpdateReleasePayload,
} from '@/types/release'
import { apiRequest, fail, mockDelay, ok } from './apiClient'
import { getConfigurationPage } from './configurationApi'

let nextReleaseId = mockReleases.length + 1

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ')
const isReleaseStatus = (value: string): value is ReleaseStatus =>
  RELEASE_STATUSES.includes(value as ReleaseStatus)

const syncCurrentRelease = (projectId: string) => {
  const project = mockProjects.find((item) => item.id === projectId)
  if (!project) return
  project.currentRelease = mockReleases.find(
    (release) => release.projectId === projectId && release.status === 'ACTIVE',
  )?.name
  project.updatedAt = new Date().toISOString()
}

const validateRelease = (
  projectId: string,
  payload: CreateReleasePayload,
  excludeReleaseId?: string,
): string | null => {
  const project = mockProjects.find((item) => item.id === projectId)
  if (!project) return 'Project not found.'
  if (project.status !== 'ACTIVE') return 'Releases cannot be changed for an inactive project.'

  const name = normalizeText(payload.name)
  const version = normalizeText(payload.version)
  if (!name) return 'Release Name is required.'
  if (!version) return 'Version is required.'
  if (!payload.releaseTypeId) return 'Release Type is required.'
  if (!payload.releaseDate) return 'Release Date is required.'
  if (!isReleaseStatus(payload.status)) return 'Select a valid Release Status.'
  if (payload.releaseDate < project.startDate || payload.releaseDate > project.endDate) {
    return 'Release Date must be within the project period.'
  }

  const releaseType = mockReleaseTypes.find(
    (item) => item.id === payload.releaseTypeId && item.active,
  )
  if (!releaseType) return 'Select an active Release Type.'

  if (
    mockReleases.some(
      (item) =>
        item.projectId === projectId &&
        item.id !== excludeReleaseId &&
        item.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    return 'A release with this name already exists in the selected project.'
  }
  if (
    mockReleases.some(
      (item) =>
        item.projectId === projectId &&
        item.id !== excludeReleaseId &&
        item.version.toLowerCase() === version.toLowerCase(),
    )
  ) {
    return 'A release with this version already exists in the selected project.'
  }
  if (
    payload.status === 'ACTIVE' &&
    mockReleases.some(
      (item) =>
        item.projectId === projectId && item.id !== excludeReleaseId && item.status === 'ACTIVE',
    )
  ) {
    return 'This project already has an ACTIVE release. Put it ON_HOLD or mark it COMPLETED before activating another release.'
  }

  return null
}

export const releaseService = {
  async getReleases(request: PageRequest): Promise<ApiResponse<Page<ReleaseRecord>>> {
    const projectId = String(request.filters?.projectId ?? '')
    if (!projectId) return fail('Project is required to load releases.')
    const { projectId: _projectId, ...filters } = request.filters ?? {}
    void _projectId
    return getConfigurationPage(`/projects/${encodeURIComponent(projectId)}/releases`, {
      ...request,
      filters,
    })
  },

  async getReleaseById(
    projectId: string,
    releaseId: string,
  ): Promise<ApiResponse<ReleaseRecord>> {
    const response = await this.getReleases({
      pageNumber: 0,
      pageSize: 1000,
      filters: { projectId },
    })
    if (!response.success) return fail(response.message)
    const release = response.data.content.find((item) => String(item.id) === String(releaseId))
    return release ? ok(release, response.message) : fail('Release not found.')
  },

  async createRelease(
    projectId: string,
    payload: CreateReleasePayload,
  ): Promise<ApiResponse<ReleaseRecord>> {
    return apiRequest(`/projects/${encodeURIComponent(projectId)}/releases`, {
      method: 'POST',
      body: {
        ...payload,
        name: normalizeText(payload.name),
        version: normalizeText(payload.version),
        description: payload.description.trim(),
      },
    })
  },

  async updateRelease(
    projectId: string,
    releaseId: string,
    payload: UpdateReleasePayload,
  ): Promise<ApiResponse<ReleaseRecord>> {
    await mockDelay(500)
    const index = mockReleases.findIndex(
      (item) => item.id === releaseId && item.projectId === projectId,
    )
    if (index === -1) return fail('Release not found.')
    if (mockReleases[index].status === 'COMPLETED') {
      return fail('A COMPLETED release is historical and cannot be updated.')
    }

    const validationError = validateRelease(projectId, payload, releaseId)
    if (validationError) return fail(validationError)
    const releaseType = mockReleaseTypes.find((item) => item.id === payload.releaseTypeId)!
    const updated: ReleaseRecord = {
      ...mockReleases[index],
      name: normalizeText(payload.name),
      version: normalizeText(payload.version),
      releaseTypeId: payload.releaseTypeId,
      releaseTypeName: releaseType.name,
      description: payload.description.trim(),
      releaseDate: payload.releaseDate,
      status: payload.status,
      updatedAt: new Date().toISOString(),
    }
    mockReleases[index] = updated
    syncCurrentRelease(projectId)
    return ok({ ...updated }, 'Release updated successfully.')
  },

  async updateReleaseStatus(
    projectId: string,
    releaseId: string,
    status: ReleaseStatus,
  ): Promise<ApiResponse<ReleaseRecord>> {
    await mockDelay(400)
    const index = mockReleases.findIndex(
      (item) => item.id === releaseId && item.projectId === projectId,
    )
    if (index === -1) return fail('Release not found.')
    if (!isReleaseStatus(status)) return fail('Select a valid Release Status.')

    const current = mockReleases[index]
    const project = mockProjects.find((item) => item.id === projectId)
    if (project?.status !== 'ACTIVE') return fail('Release status cannot be changed for an inactive project.')
    if (current.status === 'COMPLETED' && status !== 'COMPLETED') {
      return fail('A COMPLETED release cannot be reopened.')
    }
    if (
      status === 'ACTIVE' &&
      mockReleases.some(
        (item) => item.projectId === projectId && item.id !== releaseId && item.status === 'ACTIVE',
      )
    ) {
      return fail('This project already has an ACTIVE release.')
    }

    const updated = { ...current, status, updatedAt: new Date().toISOString() }
    mockReleases[index] = updated
    syncCurrentRelease(projectId)
    return ok({ ...updated }, `Release status changed to ${status.replace('_', ' ')}.`)
  },

  async deleteRelease(projectId: string, releaseId: string): Promise<ApiResponse<null>> {
    await mockDelay(400)
    const project = mockProjects.find((item) => item.id === projectId)
    if (project?.status !== 'ACTIVE') return fail('Releases cannot be deleted from an inactive project.')
    const index = mockReleases.findIndex(
      (item) => item.id === releaseId && item.projectId === projectId,
    )
    if (index === -1) return fail('Release not found.')
    if (mockReleases[index].status !== 'ON_HOLD') {
      return fail('Only an ON_HOLD release can be deleted. ACTIVE and COMPLETED releases must be retained.')
    }
    mockReleases.splice(index, 1)
    syncCurrentRelease(projectId)
    return ok(null, 'Release deleted successfully.')
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
    })
  },
}
