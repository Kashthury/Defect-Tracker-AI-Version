import { STATUS_TYPE_LABELS, isStatusTypeCode } from '@/constants/statusTypes'
import { mockStatusTypes } from '@/mock/configuration'
import { mockDefectWorkflowStore } from '@/mock/defectWorkflow'
import { ALL_DEFECTS, ALL_TEST_CASES } from '@/mock/generators'
import { ApiResponse, Page, PageRequest } from '@/types/common'
import {
  CreateStatusTypePayload,
  StatusTypeRecord,
  UpdateStatusTypePayload,
} from '@/types/statusType'
import { fail, mockDelay, ok, paginate } from './apiClient'

let nextId = mockStatusTypes.length + 1

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/
const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ')
const normalizeColor = (value: string) => value.trim().toUpperCase()

const findDuplicateName = (name: string, excludeId?: string) =>
  mockStatusTypes.find(
    (status) => status.id !== excludeId && status.name.toLowerCase() === name.toLowerCase(),
  )

const usageCount = (status: StatusTypeRecord) => {
  const systemName = STATUS_TYPE_LABELS[status.code].toLowerCase()
  const matches = (value: string) => value.trim().toLowerCase() === systemName

  const defectCount = ALL_DEFECTS.filter((item) => item.statusCode === status.code).length
  const recordCount = ALL_TEST_CASES.map((item) => item.status).filter(matches).length

  const workflowCount = mockDefectWorkflowStore.current?.nodes.some(
    (node) => node.statusId === status.id,
  )
    ? 1
    : 0

  return defectCount + recordCount + workflowCount
}

/** Mock Status Type API shaped for a future Spring Boot controller. */
export const statusTypeService = {
  async getStatusTypes(request: PageRequest): Promise<ApiResponse<Page<StatusTypeRecord>>> {
    await mockDelay()
    return ok(paginate(mockStatusTypes, request, ['name']))
  },

  async getStatusTypeById(id: string): Promise<ApiResponse<StatusTypeRecord>> {
    await mockDelay()
    const status = mockStatusTypes.find((item) => item.id === id)
    if (!status) return fail('Status type not found.')
    return ok(status)
  },

  async createStatusType(
    payload: CreateStatusTypePayload,
  ): Promise<ApiResponse<StatusTypeRecord>> {
    await mockDelay(500)

    const code = payload.code.trim().toUpperCase()
    if (!isStatusTypeCode(code)) return fail('Select a valid controlled Enum Code.')
    if (mockStatusTypes.some((status) => status.code === code)) {
      return fail('This status enum code is already configured.')
    }

    const name = normalizeName(payload.name)
    if (!name) return fail('Status Name is required.')
    if (findDuplicateName(name)) return fail('A status with this name already exists.')

    const color = normalizeColor(payload.color)
    if (!color) return fail('Display Color is required.')
    if (!HEX_PATTERN.test(color)) return fail('Display Color must be a valid hex color.')

    const status: StatusTypeRecord = {
      id: `st-${nextId++}`,
      code,
      name,
      color,
      createdAt: new Date().toISOString(),
    }
    mockStatusTypes.unshift(status)
    return ok(status, 'Status type created successfully.')
  },

  async updateStatusType(
    id: string,
    payload: UpdateStatusTypePayload,
  ): Promise<ApiResponse<StatusTypeRecord>> {
    await mockDelay(500)

    const index = mockStatusTypes.findIndex((item) => item.id === id)
    if (index === -1) return fail('Status type not found.')

    const name = normalizeName(payload.name)
    if (!name) return fail('Status Name is required.')
    if (findDuplicateName(name, id)) return fail('A status with this name already exists.')

    const color = normalizeColor(payload.color)
    if (!color) return fail('Display Color is required.')
    if (!HEX_PATTERN.test(color)) return fail('Display Color must be a valid hex color.')

    const updated: StatusTypeRecord = {
      ...mockStatusTypes[index],
      name,
      color,
    }
    mockStatusTypes[index] = updated
    return ok(updated, 'Status type updated successfully.')
  },

  async deleteStatusType(id: string): Promise<ApiResponse<null>> {
    await mockDelay(400)

    const index = mockStatusTypes.findIndex((item) => item.id === id)
    if (index === -1) return fail('Status type not found.')

    if (usageCount(mockStatusTypes[index]) > 0) {
      return fail('This status is already used and cannot be deleted.')
    }

    mockStatusTypes.splice(index, 1)
    return ok(null, 'Status type deleted successfully.')
  },
}
