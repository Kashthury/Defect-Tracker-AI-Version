import { ApiResponse, Page, PageRequest } from '@/types/common'
import { PriorityConfig } from '@/types/defect'
import { CreatePriorityPayload, UpdatePriorityPayload } from '@/types/priority'
import { mockPriorities } from '@/mock/configuration'
import { ALL_DEFECTS } from '@/mock/generators'
import { fail, mockDelay, ok, paginate } from './apiClient'

let nextId = mockPriorities.length + 1

const DEFAULT_COLOR = '#12507F'
const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ')

const normalizeColor = (value: string | undefined) => {
  const color = (value ?? '').trim()
  return HEX_PATTERN.test(color) ? color.toUpperCase() : DEFAULT_COLOR
}

const findDuplicate = (name: string, excludeId?: string) =>
  mockPriorities.find(
    (p) => p.id !== excludeId && p.name.toLowerCase() === name.toLowerCase(),
  )

const usageCount = (name: string) => ALL_DEFECTS.filter((d) => d.priority === name).length

/**
 * Mock Priority Management API. Reads/writes the shared `mockPriorities` array
 * and returns the standard ApiResponse / Page envelope.
 */
export const priorityService = {
  async getPriorities(request: PageRequest): Promise<ApiResponse<Page<PriorityConfig>>> {
    await mockDelay()
    return ok(paginate(mockPriorities, request, ['name']))
  },

  async getPriorityById(id: string): Promise<ApiResponse<PriorityConfig>> {
    await mockDelay()
    const priority = mockPriorities.find((p) => p.id === id)
    if (!priority) return fail('Priority not found.')
    return ok(priority)
  },

  async createPriority(payload: CreatePriorityPayload): Promise<ApiResponse<PriorityConfig>> {
    await mockDelay(500)

    const name = normalizeName(payload.name)
    if (!name) return fail('Priority Name is required.')
    if (findDuplicate(name)) return fail('A priority with this name already exists.')

    const priority: PriorityConfig = {
      id: `pr-${nextId++}`,
      name,
      description: payload.description?.trim() ?? '',
      color: normalizeColor(payload.color),
      active: true,
      createdAt: new Date().toISOString(),
    }
    mockPriorities.unshift(priority)
    return ok(priority, 'Priority created successfully.')
  },

  async updatePriority(id: string, payload: UpdatePriorityPayload): Promise<ApiResponse<PriorityConfig>> {
    await mockDelay(500)

    const index = mockPriorities.findIndex((p) => p.id === id)
    if (index === -1) return fail('Priority not found.')

    const name = normalizeName(payload.name)
    if (!name) return fail('Priority Name is required.')
    if (findDuplicate(name, id)) return fail('A priority with this name already exists.')

    const updated: PriorityConfig = {
      ...mockPriorities[index],
      name,
      description: payload.description?.trim() ?? '',
      color: normalizeColor(payload.color),
    }
    mockPriorities[index] = updated
    return ok(updated, 'Priority updated successfully.')
  },

  async deletePriority(id: string): Promise<ApiResponse<null>> {
    await mockDelay(400)

    const index = mockPriorities.findIndex((p) => p.id === id)
    if (index === -1) return fail('Priority not found.')

    const inUse = usageCount(mockPriorities[index].name)
    if (inUse > 0) {
      return fail(
        `This priority is used by ${inUse} defect${inUse === 1 ? '' : 's'} and cannot be deleted.`,
      )
    }

    mockPriorities.splice(index, 1)
    return ok(null, 'Priority deleted successfully.')
  },
}
