import { ApiResponse, Page, PageRequest } from '@/types/common'
import { Designation } from '@/types/auth'
import { CreateDesignationPayload, UpdateDesignationPayload } from '@/types/designation'
import { mockDesignations } from '@/mock/designations'
import { mockEmployeeRecords } from '@/mock/employees'
import { fail, mockDelay, ok, paginate } from './apiClient'

let nextId = mockDesignations.length + 1

/** Collapse internal runs of whitespace and strip leading/trailing spaces. */
const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ')

const findDuplicate = (title: string, excludeId?: string) =>
  mockDesignations.find(
    (d) => d.id !== excludeId && d.title.toLowerCase() === title.toLowerCase(),
  )

const employeeCount = (designationId: string) =>
  mockEmployeeRecords.filter((e) => e.designationId === designationId).length

/**
 * Mock Designation Management API. Reads/writes the shared `mockDesignations`
 * array so employee references stay consistent. Swapping these bodies for real
 * fetch() calls later requires no page changes.
 */
export const designationService = {
  async getDesignations(request: PageRequest): Promise<ApiResponse<Page<Designation>>> {
    await mockDelay()
    return ok(paginate(mockDesignations, request, ['title']))
  },

  async getDesignationById(id: string): Promise<ApiResponse<Designation>> {
    await mockDelay()
    const designation = mockDesignations.find((d) => d.id === id)
    if (!designation) return fail('Designation not found.')
    return ok(designation)
  },

  async createDesignation(payload: CreateDesignationPayload): Promise<ApiResponse<Designation>> {
    await mockDelay(500)

    const title = normalizeName(payload.title)
    if (!title) return fail('Designation Name is required.')
    if (findDuplicate(title)) return fail('A designation with this name already exists.')

    const designation: Designation = { id: `des-${nextId++}`, title }
    mockDesignations.unshift(designation)
    return ok(designation, 'Designation created successfully.')
  },

  async updateDesignation(
    id: string,
    payload: UpdateDesignationPayload,
  ): Promise<ApiResponse<Designation>> {
    await mockDelay(500)

    const index = mockDesignations.findIndex((d) => d.id === id)
    if (index === -1) return fail('Designation not found.')

    const title = normalizeName(payload.title)
    if (!title) return fail('Designation Name is required.')
    if (findDuplicate(title, id)) return fail('A designation with this name already exists.')

    const updated: Designation = { ...mockDesignations[index], title }
    mockDesignations[index] = updated
    return ok(updated, 'Designation updated successfully.')
  },

  async deleteDesignation(id: string): Promise<ApiResponse<null>> {
    await mockDelay(400)

    const index = mockDesignations.findIndex((d) => d.id === id)
    if (index === -1) return fail('Designation not found.')

    const inUse = employeeCount(id)
    if (inUse > 0) {
      return fail(
        `This designation is assigned to ${inUse} employee${inUse === 1 ? '' : 's'} and cannot be deleted.`,
      )
    }

    mockDesignations.splice(index, 1)
    return ok(null, 'Designation deleted successfully.')
  },
}
