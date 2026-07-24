import { mockProjectAllocations } from '@/mock/projectAllocations'
import { mockEmployeeRecords } from '@/mock/employees'
import { mockRoles } from '@/mock/roles'
import { ApiResponse } from '@/types/common'
import { AssignedProjectMember, ModuleRecord, SubmoduleRecord } from '@/types/moduleManagement'
import { apiRequest, fail, ok } from './apiClient'
import { employeeService } from './employeeService'

let nextModule = 20
let nextSubmodule = 40
const tidy = (value: string) => value.trim().replace(/\s+/g, ' ')

const mapModule = (projectId: string, item: ModuleRecord): ModuleRecord => ({
  ...item,
  id: String(item.id),
  projectId: String(item.projectId ?? projectId),
  description: item.description ?? '',
  active: item.active !== false,
  qaEmployeeIds: (item.qaEmployeeIds ?? []).map(String),
  submoduleCount: item.submoduleCount ?? 0,
  testCaseCount: item.testCaseCount ?? 0,
  defectCount: item.defectCount ?? 0,
})

const mapSubmodule = (projectId: string, item: SubmoduleRecord): SubmoduleRecord => ({
  ...item,
  id: String(item.id),
  projectId: String(item.projectId ?? projectId),
  moduleId: String(item.moduleId),
  description: item.description ?? '',
  active: item.active !== false,
  developerEmployeeIds: (item.developerEmployeeIds ?? []).map(String),
  testCaseCount: item.testCaseCount ?? 0,
  defectCount: item.defectCount ?? 0,
})

function availableMembers(projectId: string, roleTypes: string[]): AssignedProjectMember[] {
  const today = new Date().toISOString().slice(0, 10)
  return mockProjectAllocations
    .filter((a) => a.projectId === projectId && a.status === 'ACTIVE' && a.startDate <= today && a.endDate >= today)
    .map((allocation) => {
      const role = mockRoles.find((r) => r.id === allocation.roleId)
      const employee = mockEmployeeRecords.find((e) => e.id === allocation.employeeId)
      if (!role || !employee || employee.status !== 'ACTIVE' || !roleTypes.includes(role.roleType)) return null
      return {
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        roleName: role.name,
        roleType: role.roleType,
        allocationPercentage: allocation.allocationPercentage,
        startDate: allocation.startDate,
        endDate: allocation.endDate,
      }
    })
    .filter(Boolean) as AssignedProjectMember[]
}

export const moduleManagementService = {
  async getModules(projectId: string): Promise<ApiResponse<ModuleRecord[]>> {
    const response = await apiRequest<ModuleRecord[] | { content?: ModuleRecord[] }>(
      `/projects/${encodeURIComponent(projectId)}/modules`,
    )
    if (!response.success) return fail(response.message)
    const rows = Array.isArray(response.data) ? response.data : response.data.content ?? []
    return ok(rows.map((item) => mapModule(projectId, item)).filter((item) => item.active !== false), response.message)
  },
  async createModule(projectId: string, payload: Pick<ModuleRecord, 'name' | 'description'>): Promise<ApiResponse<ModuleRecord>> {
    const name = tidy(payload.name)
    if (!name) return fail('Module Name is required.')
    return apiRequest(`/projects/${encodeURIComponent(projectId)}/modules`, {
      method: 'POST',
      body: { name, description: tidy(payload.description), active: true },
    })
  },
  async updateModule(projectId: string, id: string, payload: Pick<ModuleRecord, 'name' | 'description'>): Promise<ApiResponse<ModuleRecord>> {
    const name = tidy(payload.name)
    if (!name) return fail('Module Name is required.')
    return apiRequest(`/projects/${encodeURIComponent(projectId)}/modules/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: { name, description: tidy(payload.description), active: true },
    })
  },
  deleteModule(projectId: string, moduleId: string): Promise<ApiResponse<null>> {
    return apiRequest(`/projects/${encodeURIComponent(projectId)}/modules/${encodeURIComponent(moduleId)}`, {
      method: 'DELETE',
    })
  },
  async getSubmodules(projectId: string, moduleId?: string): Promise<ApiResponse<SubmoduleRecord[]>> {
    const response = await apiRequest<SubmoduleRecord[] | { content?: SubmoduleRecord[] }>(
      `/projects/${encodeURIComponent(projectId)}/submodules`,
      { query: { moduleId } },
    )
    if (!response.success) return fail(response.message)
    const rows = Array.isArray(response.data) ? response.data : response.data.content ?? []
    return ok(
      rows
        .map((item) => mapSubmodule(projectId, item))
        .filter((item) => item.active !== false && (!moduleId || String(item.moduleId) === String(moduleId))),
      response.message,
    )
  },
  async createSubmodule(projectId: string, moduleId: string, payload: Pick<SubmoduleRecord, 'name' | 'description'>): Promise<ApiResponse<SubmoduleRecord>> {
    const name = tidy(payload.name)
    if (!name) return fail('Submodule Name is required.')
    return apiRequest(`/projects/${encodeURIComponent(projectId)}/submodules`, {
      method: 'POST',
      body: { moduleId, name, description: tidy(payload.description), active: true },
    })
  },
  async updateSubmodule(projectId: string, item: SubmoduleRecord, payload: Pick<SubmoduleRecord, 'name' | 'description'>): Promise<ApiResponse<SubmoduleRecord>> {
    const name = tidy(payload.name)
    if (!name) return fail('Submodule Name is required.')
    return apiRequest(`/projects/${encodeURIComponent(projectId)}/submodules/${encodeURIComponent(item.id)}`, {
      method: 'PUT',
      body: { moduleId: item.moduleId, name, description: tidy(payload.description), active: true },
    })
  },
  deleteSubmodule(projectId: string, submoduleId: string): Promise<ApiResponse<null>> {
    return apiRequest(`/projects/${encodeURIComponent(projectId)}/submodules/${encodeURIComponent(submoduleId)}`, {
      method: 'DELETE',
    })
  },
  async getAvailableQa(projectId: string): Promise<ApiResponse<AssignedProjectMember[]>> {
    const response = await employeeService.getProjectQaEmployees(projectId)
    if (!response.success) return fail(response.message)
    return ok(response.data.map((employee) => ({ employeeId: String(employee.id), employeeName: employee.fullName, roleName: employee.designationName || 'QA', roleType: 'QA', allocationPercentage: 0, startDate: '', endDate: '' })), response.message)
  },
  async getAvailableDevelopers(projectId: string): Promise<ApiResponse<AssignedProjectMember[]>> {
    const response = await employeeService.getProjectDevelopers(projectId)
    if (!response.success) return fail(response.message)
    return ok(response.data.map((developer) => ({
      employeeId: String(developer.id),
      employeeName: developer.fullName,
      roleName: developer.designationName || 'Developer',
      roleType: 'DEVELOPER',
      allocationPercentage: 0,
      startDate: '',
      endDate: '',
    })), response.message)
  },
  addQaMembers(projectId: string, moduleId: string, employeeIds: string[]): Promise<ApiResponse<unknown>> {
    return apiRequest(
      `/projects/${encodeURIComponent(projectId)}/modules/${encodeURIComponent(moduleId)}/qa-members`,
      { method: 'POST', body: { employeeIds: employeeIds.map(Number) } },
    )
  },
  removeQaMembers(projectId: string, moduleId: string, employeeIds: string[]): Promise<ApiResponse<unknown>> {
    return apiRequest(
      `/projects/${encodeURIComponent(projectId)}/modules/${encodeURIComponent(moduleId)}/qa-members`,
      { method: 'DELETE', body: { employeeIds: employeeIds.map(Number) } },
    )
  },
  addDevelopers(projectId: string, submoduleId: string, employeeIds: string[]): Promise<ApiResponse<unknown>> {
    return apiRequest(
      `/projects/${encodeURIComponent(projectId)}/submodules/${encodeURIComponent(submoduleId)}/developers`,
      { method: 'POST', body: { employeeIds: employeeIds.map(Number) } },
    )
  },
  removeDevelopers(projectId: string, submoduleId: string, employeeIds: string[]): Promise<ApiResponse<unknown>> {
    return apiRequest(
      `/projects/${encodeURIComponent(projectId)}/submodules/${encodeURIComponent(submoduleId)}/developers`,
      { method: 'DELETE', body: { employeeIds: employeeIds.map(Number) } },
    )
  },
}
