import { ApiResponse, Page, PageRequest } from '@/types/common'
import { SeverityConfig } from '@/types/defect'
import { CreateSeverityPayload, UpdateSeverityPayload } from '@/types/severity'
import { mockSeverities } from '@/mock/configuration'
import { ALL_DEFECTS } from '@/mock/generators'
import { fail, mockDelay, ok, paginate } from './apiClient'

let nextId = mockSeverities.length + 1

const DEFAULT_COLOR = '#C13B3B'
const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ')

const normalizeColor = (value: string | undefined) => {
  const color = (value ?? '').trim()
  return HEX_PATTERN.test(color) ? color.toUpperCase() : DEFAULT_COLOR
}

const normalizeWeight = (value: number) => {
  const weight = Number(value)
  if (!Number.isFinite(weight)) return 1
  return Math.max(1, Math.round(weight))
}

const toneFromName = (name: string): SeverityConfig['colorTone'] => {
  switch (name.trim().toLowerCase()) {
    case 'critical':
      return 'critical'
    case 'high':
      return 'high'
    case 'medium':
      return 'medium'
    case 'low':
      return 'low'
    default:
      return 'medium'
  }
}

const findDuplicate = (name: string, excludeId?: string) =>
  mockSeverities.find(
    (severity) => severity.id !== excludeId && severity.name.toLowerCase() === name.toLowerCase(),
  )

const usageCount = (name: string) => ALL_DEFECTS.filter((defect) => defect.severity === name).length

/**
 * Mock Severity Management API. Weight is persisted with the mock config and
 * reused by Dashboard to calculate severity defect index values.
 */
export const severityService = {
  async getSeverities(request: PageRequest): Promise<ApiResponse<Page<SeverityConfig>>> {
    await mockDelay()
    return ok(paginate(mockSeverities, request, ['name']))
  },

  async getSeverityById(id: string): Promise<ApiResponse<SeverityConfig>> {
    await mockDelay()
    const severity = mockSeverities.find((item) => item.id === id)
    if (!severity) return fail('Severity not found.')
    return ok(severity)
  },

  async createSeverity(payload: CreateSeverityPayload): Promise<ApiResponse<SeverityConfig>> {
    await mockDelay(500)

    const name = normalizeName(payload.name)
    if (!name) return fail('Severity Name is required.')
    if (findDuplicate(name)) return fail('A severity with this name already exists.')

    const severity: SeverityConfig = {
      id: `sev-${nextId++}`,
      name,
      description: payload.description?.trim() ?? '',
      weight: normalizeWeight(payload.weight),
      color: normalizeColor(payload.color),
      colorTone: toneFromName(name),
      active: true,
      createdAt: new Date().toISOString(),
    }
    mockSeverities.unshift(severity)
    return ok(severity, 'Severity created successfully.')
  },

  async updateSeverity(id: string, payload: UpdateSeverityPayload): Promise<ApiResponse<SeverityConfig>> {
    await mockDelay(500)

    const index = mockSeverities.findIndex((item) => item.id === id)
    if (index === -1) return fail('Severity not found.')

    const name = normalizeName(payload.name)
    if (!name) return fail('Severity Name is required.')
    if (findDuplicate(name, id)) return fail('A severity with this name already exists.')

    const updated: SeverityConfig = {
      ...mockSeverities[index],
      name,
      description: payload.description?.trim() ?? '',
      weight: normalizeWeight(payload.weight),
      color: normalizeColor(payload.color),
      colorTone: toneFromName(name),
    }
    mockSeverities[index] = updated
    return ok(updated, 'Severity updated successfully.')
  },

  async deleteSeverity(id: string): Promise<ApiResponse<null>> {
    await mockDelay(400)

    const index = mockSeverities.findIndex((item) => item.id === id)
    if (index === -1) return fail('Severity not found.')

    const inUse = usageCount(mockSeverities[index].name)
    if (inUse > 0) {
      return fail(
        `This severity is used by ${inUse} defect${inUse === 1 ? '' : 's'} and cannot be deleted.`,
      )
    }

    mockSeverities.splice(index, 1)
    return ok(null, 'Severity deleted successfully.')
  },
}
