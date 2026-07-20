import { ApiResponse, Page, PageRequest } from '@/types/common'
import { DefectTypeConfig } from '@/types/defect'
import { CreateDefectTypePayload, UpdateDefectTypePayload } from '@/types/defectType'
import { mockDefectTypes } from '@/mock/configuration'
import { ALL_DEFECTS } from '@/mock/generators'
import { fail, mockDelay, ok, paginate } from './apiClient'

let nextId = mockDefectTypes.length + 1

/** Collapse internal whitespace runs and strip leading/trailing spaces. */
const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ')

const findDuplicate = (name: string, excludeId?: string) =>
  mockDefectTypes.find(
    (t) => t.id !== excludeId && t.name.toLowerCase() === name.toLowerCase(),
  )

const usageCount = (name: string) => ALL_DEFECTS.filter((d) => d.defectType === name).length

/**
 * Mock Defect Type Management API. Reads/writes the shared `mockDefectTypes`
 * array. Every method returns the standard ApiResponse / Page envelope, so
 * swapping these bodies for real fetch() calls later needs no page changes.
 */
export const defectTypeService = {
  async getDefectTypes(request: PageRequest): Promise<ApiResponse<Page<DefectTypeConfig>>> {
    await mockDelay()
    return ok(paginate(mockDefectTypes, request, ['name']))
  },

  async getDefectTypeById(id: string): Promise<ApiResponse<DefectTypeConfig>> {
    await mockDelay()
    const defectType = mockDefectTypes.find((t) => t.id === id)
    if (!defectType) return fail('Defect type not found.')
    return ok(defectType)
  },

  async createDefectType(payload: CreateDefectTypePayload): Promise<ApiResponse<DefectTypeConfig>> {
    await mockDelay(500)

    const name = normalizeName(payload.name)
    if (!name) return fail('Defect Type Name is required.')
    if (findDuplicate(name)) return fail('A defect type with this name already exists.')

    const defectType: DefectTypeConfig = {
      id: `dt-${nextId++}`,
      name,
      description: payload.description?.trim() ?? '',
      active: true,
      createdAt: new Date().toISOString(),
    }
    mockDefectTypes.unshift(defectType)
    return ok(defectType, 'Defect type created successfully.')
  },

  async updateDefectType(
    id: string,
    payload: UpdateDefectTypePayload,
  ): Promise<ApiResponse<DefectTypeConfig>> {
    await mockDelay(500)

    const index = mockDefectTypes.findIndex((t) => t.id === id)
    if (index === -1) return fail('Defect type not found.')

    const name = normalizeName(payload.name)
    if (!name) return fail('Defect Type Name is required.')
    if (findDuplicate(name, id)) return fail('A defect type with this name already exists.')

    const updated: DefectTypeConfig = {
      ...mockDefectTypes[index],
      name,
      description: payload.description?.trim() ?? '',
    }
    mockDefectTypes[index] = updated
    return ok(updated, 'Defect type updated successfully.')
  },

  async deleteDefectType(id: string): Promise<ApiResponse<null>> {
    await mockDelay(400)

    const index = mockDefectTypes.findIndex((t) => t.id === id)
    if (index === -1) return fail('Defect type not found.')

    const inUse = usageCount(mockDefectTypes[index].name)
    if (inUse > 0) {
      return fail(
        `This defect type is used by ${inUse} defect${inUse === 1 ? '' : 's'} and cannot be deleted.`,
      )
    }

    mockDefectTypes.splice(index, 1)
    return ok(null, 'Defect type deleted successfully.')
  },
}
