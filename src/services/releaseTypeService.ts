import { ApiResponse, Page, PageRequest } from '@/types/common'
import { ReleaseTypeConfig } from '@/types/defect'
import { CreateReleaseTypePayload, UpdateReleaseTypePayload } from '@/types/releaseType'
import { mockReleaseTypes } from '@/mock/configuration'
import { mockReleases } from '@/mock/releases'
import { fail, mockDelay, ok, paginate } from './apiClient'

let nextId = mockReleaseTypes.length + 1

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ')

const findDuplicate = (name: string, excludeId?: string) =>
  mockReleaseTypes.find(
    (t) => t.id !== excludeId && t.name.toLowerCase() === name.toLowerCase(),
  )

const usageCount = (id: string) => mockReleases.filter((release) => release.releaseTypeId === id).length

/**
 * Mock Release Type Management API. Reads/writes the shared `mockReleaseTypes`
 * array and returns the standard ApiResponse / Page envelope.
 */
export const releaseTypeService = {
  async getReleaseTypes(request: PageRequest): Promise<ApiResponse<Page<ReleaseTypeConfig>>> {
    await mockDelay()
    return ok(paginate(mockReleaseTypes, request, ['name']))
  },

  async getReleaseTypeById(id: string): Promise<ApiResponse<ReleaseTypeConfig>> {
    await mockDelay()
    const releaseType = mockReleaseTypes.find((t) => t.id === id)
    if (!releaseType) return fail('Release type not found.')
    return ok(releaseType)
  },

  async createReleaseType(payload: CreateReleaseTypePayload): Promise<ApiResponse<ReleaseTypeConfig>> {
    await mockDelay(500)

    const name = normalizeName(payload.name)
    if (!name) return fail('Release Type Name is required.')
    if (findDuplicate(name)) return fail('A release type with this name already exists.')

    const releaseType: ReleaseTypeConfig = {
      id: `rt-${nextId++}`,
      name,
      description: payload.description?.trim() ?? '',
      active: true,
      createdAt: new Date().toISOString(),
    }
    mockReleaseTypes.unshift(releaseType)
    return ok(releaseType, 'Release type created successfully.')
  },

  async updateReleaseType(
    id: string,
    payload: UpdateReleaseTypePayload,
  ): Promise<ApiResponse<ReleaseTypeConfig>> {
    await mockDelay(500)

    const index = mockReleaseTypes.findIndex((t) => t.id === id)
    if (index === -1) return fail('Release type not found.')

    const name = normalizeName(payload.name)
    if (!name) return fail('Release Type Name is required.')
    if (findDuplicate(name, id)) return fail('A release type with this name already exists.')

    const updated: ReleaseTypeConfig = {
      ...mockReleaseTypes[index],
      name,
      description: payload.description?.trim() ?? '',
    }
    mockReleaseTypes[index] = updated
    mockReleases.forEach((release) => {
      if (release.releaseTypeId === id) release.releaseTypeName = updated.name
    })
    return ok(updated, 'Release type updated successfully.')
  },

  async deleteReleaseType(id: string): Promise<ApiResponse<null>> {
    await mockDelay(400)

    const index = mockReleaseTypes.findIndex((t) => t.id === id)
    if (index === -1) return fail('Release type not found.')

    const inUse = usageCount(mockReleaseTypes[index].id)
    if (inUse > 0) {
      return fail(
        `This release type is used by ${inUse} release${inUse === 1 ? '' : 's'} and cannot be deleted.`,
      )
    }

    mockReleaseTypes.splice(index, 1)
    return ok(null, 'Release type deleted successfully.')
  },
}
