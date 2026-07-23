import { ApiResponse, Page, PageRequest } from '@/types/common'
import {
  AllocatedTeamMember,
  AllocationDisplayStatus,
  AllocationHistoryEntry,
  AvailableEmployee,
  CreateTeamMemberAllocationsPayload,
  DeallocateTeamMemberPayload,
  DeallocateTeamMembersPayload,
  EmployeeAllocationSummary,
  ExtendTeamMemberAllocationPayload,
  ProjectAllocation,
  ProjectAllocationSummary,
  UpdateTeamMemberAllocationPercentagePayload,
  UpdateTeamMemberAllocationRolePayload,
} from '@/types/project'
import { apiRequest, fail, ok } from './apiClient'

type Json = Record<string, any>
type BackendPage<T> = Partial<Page<T>> & { number?: number; size?: number; items?: T[]; totalItems?: number }

const numberValue = (...values: unknown[]) => Number(values.find((value) => value !== undefined && value !== null) ?? 0)
const stringValue = (...values: unknown[]) => String(values.find((value) => value !== undefined && value !== null) ?? '')
const displayStatus = (value: unknown): AllocationDisplayStatus => {
  const status = stringValue(value).toUpperCase()
  if (status === 'SCHEDULED' || status === 'ACTIVE' || status === 'COMPLETED' || status === 'CANCELLED') return status
  return status === 'CLOSED' ? 'COMPLETED' : 'ACTIVE'
}

const mapSummary = (source: Json): EmployeeAllocationSummary => ({
  allocationId: stringValue(source.allocationId, source.id),
  projectId: stringValue(source.projectId),
  projectName: stringValue(source.projectName),
  roleId: stringValue(source.roleId),
  roleName: stringValue(source.roleName),
  allocationPercentage: numberValue(source.allocationPercentage, source.allocationPercent),
  startDate: stringValue(source.startDate),
  endDate: stringValue(source.endDate),
  status: displayStatus(source.status),
  managerAllocation: Boolean(source.managerAllocation ?? source.allocationType === 'PROJECT_MANAGER'),
})

const mapAvailableEmployee = (source: Json): AvailableEmployee => ({
  employeeId: stringValue(source.employeeId, source.id),
  employeeName: stringValue(source.employeeName, source.fullName),
  employeeCode: source.employeeCode ? String(source.employeeCode) : undefined,
  email: stringValue(source.email),
  phone: source.phone ?? source.phoneNo,
  joinDate: source.joinDate,
  designationId: stringValue(source.designationId),
  designationName: stringValue(source.designationName),
  allocatedPercentage: numberValue(source.allocatedPercentage, source.currentAllocationPercentage, source.allocationPercentage),
  availablePercentage: numberValue(source.availablePercentage),
  allocations: Array.isArray(source.allocations) ? source.allocations.map(mapSummary) : [],
})

const mapAllocatedMember = (source: Json): AllocatedTeamMember => ({
  allocationId: stringValue(source.allocationId, source.id),
  projectId: stringValue(source.projectId),
  employeeId: stringValue(source.employeeId),
  employeeName: stringValue(source.employeeName, source.fullName),
  employeeCode: source.employeeCode ? String(source.employeeCode) : undefined,
  email: source.email,
  designationId: source.designationId ? String(source.designationId) : undefined,
  designationName: stringValue(source.designationName),
  roleId: stringValue(source.roleId),
  roleName: stringValue(source.roleName),
  roleType: stringValue(source.roleType),
  allocationPercentage: numberValue(source.allocationPercentage, source.allocationPercent),
  startDate: stringValue(source.startDate),
  endDate: stringValue(source.endDate),
  status: displayStatus(source.status),
  managerAllocation: Boolean(source.managerAllocation ?? source.allocationType === 'PROJECT_MANAGER'),
})

const mapPage = <T, R>(source: BackendPage<T> | T[], request: PageRequest, mapper: (row: T) => R): Page<R> => {
  const rows = Array.isArray(source) ? source : source.content ?? source.items ?? []
  const pageSize = Array.isArray(source) ? request.pageSize : source.pageSize ?? source.size ?? request.pageSize
  const totalElements = Array.isArray(source) ? rows.length : source.totalElements ?? source.totalItems ?? rows.length
  return {
    content: rows.map(mapper),
    pageNumber: Array.isArray(source) ? request.pageNumber : source.pageNumber ?? source.number ?? request.pageNumber,
    pageSize,
    totalElements,
    totalPages: Array.isArray(source) ? Math.max(1, Math.ceil(totalElements / pageSize)) : source.totalPages ?? Math.max(1, Math.ceil(totalElements / pageSize)),
  }
}

const queryFrom = (request: PageRequest) => ({
  search: request.search?.trim() || undefined,
  designationId: request.filters?.designationId === 'All' ? undefined : request.filters?.designationId,
  availabilityBand: request.filters?.availabilityBand === 'All' ? undefined : request.filters?.availabilityBand,
  roleId: request.filters?.roleId === 'All' ? undefined : request.filters?.roleId,
  status: request.filters?.status === 'All' ? undefined : request.filters?.status,
  startDate: request.filters?.startDate,
  endDate: request.filters?.endDate,
  pageNumber: request.pageNumber,
  pageSize: request.pageSize,
  sortBy: request.sortBy,
  sortDir: request.sortDir,
})

const listAvailable = async (path: string, request: PageRequest): Promise<ApiResponse<Page<AvailableEmployee>>> => {
  const response = await apiRequest<BackendPage<Json> | Json[]>(path, { query: queryFrom(request) })
  return response.success ? ok(mapPage(response.data, request, mapAvailableEmployee), response.message) : fail(response.message)
}

export const projectAllocationService = {
  getAvailableEmployees(request: PageRequest) {
    return listAvailable('/bench/available-employees', request)
  },

  getProjectAvailableEmployees(projectId: string, request: PageRequest) {
    return listAvailable(`/projects/${encodeURIComponent(projectId)}/available-employees`, request)
  },

  async getProjectTeamAllocations(projectId: string, request: PageRequest): Promise<ApiResponse<Page<AllocatedTeamMember>>> {
    const response = await apiRequest<BackendPage<Json> | Json[]>(`/projects/${encodeURIComponent(projectId)}/allocations`, { query: queryFrom(request) })
    return response.success ? ok(mapPage(response.data, request, mapAllocatedMember), response.message) : fail(response.message)
  },

  createTeamMemberAllocations(payload: CreateTeamMemberAllocationsPayload): Promise<ApiResponse<ProjectAllocation[]>> {
    return apiRequest('/project-allocations/bulk', { method: 'POST', body: payload })
  },

  updateTeamMemberAllocationPercentage(allocationId: string, payload: UpdateTeamMemberAllocationPercentagePayload): Promise<ApiResponse<ProjectAllocation>> {
    return apiRequest(`/project-allocations/${encodeURIComponent(allocationId)}/percentage`, { method: 'PATCH', body: payload })
  },

  updateTeamMemberAllocationRole(allocationId: string, payload: UpdateTeamMemberAllocationRolePayload): Promise<ApiResponse<ProjectAllocation>> {
    return apiRequest(`/project-allocations/${encodeURIComponent(allocationId)}/role`, { method: 'PATCH', body: payload })
  },

  extendTeamMemberAllocation(allocationId: string, payload: ExtendTeamMemberAllocationPayload): Promise<ApiResponse<ProjectAllocation>> {
    return apiRequest(`/project-allocations/${encodeURIComponent(allocationId)}/extend`, { method: 'PATCH', body: payload })
  },

  deallocateTeamMember(allocationId: string, payload: DeallocateTeamMemberPayload): Promise<ApiResponse<ProjectAllocation>> {
    return apiRequest(`/project-allocations/${encodeURIComponent(allocationId)}/deallocate`, { method: 'PATCH', body: payload })
  },

  bulkDeallocateTeamMembers(payload: DeallocateTeamMembersPayload): Promise<ApiResponse<number>> {
    return apiRequest('/project-allocations/bulk-deallocate', { method: 'PATCH', body: payload })
  },

  async getProjectAllocationSummary(projectId: string): Promise<ApiResponse<ProjectAllocationSummary>> {
    return apiRequest(`/projects/${encodeURIComponent(projectId)}/allocations/summary`)
  },

  async getAllocationHistory(projectId: string | undefined, request: PageRequest): Promise<ApiResponse<Page<AllocationHistoryEntry>>> {
    const response = await apiRequest<BackendPage<Json> | Json[]>('/project-allocations/history', {
      query: { ...queryFrom(request), projectId },
    })
    if (!response.success) return fail(response.message)
    return ok(mapPage(response.data, request, (row) => ({
      id: stringValue(row.id, row.allocationId),
      projectId: stringValue(row.projectId),
      employeeId: stringValue(row.employeeId),
      employeeName: stringValue(row.employeeName),
      projectName: stringValue(row.projectName),
      roleOnProject: stringValue(row.roleOnProject, row.roleName),
      allocatedFrom: stringValue(row.allocatedFrom, row.startDate),
      allocatedTo: row.allocatedTo ?? row.endDate ?? null,
      allocationPercentage: numberValue(row.allocationPercentage, row.allocationPercent),
      status: displayStatus(row.status),
    })), response.message)
  },

  getProjectDateWarnings(projectId: string, projectStartDate: string, projectEndDate: string): Promise<ApiResponse<string[]>> {
    return apiRequest(`/projects/${encodeURIComponent(projectId)}/allocations/date-warnings`, {
      query: { startDate: projectStartDate, endDate: projectEndDate },
    })
  },
}
