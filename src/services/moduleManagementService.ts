import { mockModules, mockSubmodules } from '@/mock/moduleManagement'
import { mockProjectAllocations } from '@/mock/projectAllocations'
import { mockEmployeeRecords } from '@/mock/employees'
import { mockRoles } from '@/mock/roles'
import { ApiResponse } from '@/types/common'
import { AssignedProjectMember, ModuleRecord, SubmoduleRecord } from '@/types/moduleManagement'
import { fail, mockDelay, ok } from './apiClient'

let nextModule = 20
let nextSubmodule = 40
const tidy = (value: string) => value.trim().replace(/\s+/g, ' ')

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
    await mockDelay()
    return ok(mockModules.filter((m) => m.projectId === projectId).map((m) => ({ ...m })))
  },
  async createModule(projectId: string, payload: Pick<ModuleRecord, 'name' | 'description'>): Promise<ApiResponse<ModuleRecord>> {
    await mockDelay()
    const name = tidy(payload.name)
    if (!name) return fail('Module Name is required.')
    if (mockModules.some((m) => m.projectId === projectId && m.name.toLowerCase() === name.toLowerCase())) return fail('Module Name must be unique within the selected project.')
    const item: ModuleRecord = { id: `mod-${nextModule++}`, projectId, name, description: tidy(payload.description), qaEmployeeIds: [], submoduleCount: 0, testCaseCount: 0, defectCount: 0 }
    mockModules.push(item)
    return ok({ ...item }, 'Module created successfully.')
  },
  async updateModule(id: string, payload: Pick<ModuleRecord, 'name' | 'description'>): Promise<ApiResponse<ModuleRecord>> {
    await mockDelay()
    const item = mockModules.find((m) => m.id === id)
    if (!item) return fail('Module not found.')
    const name = tidy(payload.name)
    if (!name) return fail('Module Name is required.')
    if (mockModules.some((m) => m.projectId === item.projectId && m.id !== id && m.name.toLowerCase() === name.toLowerCase())) return fail('Module Name must be unique within the selected project.')
    item.name = name; item.description = tidy(payload.description)
    return ok({ ...item }, 'Module updated successfully.')
  },
  async deleteModule(id: string): Promise<ApiResponse<null>> {
    await mockDelay()
    const index = mockModules.findIndex((m) => m.id === id)
    if (index < 0) return fail('Module not found.')
    const item = mockModules[index]
    if (mockSubmodules.some((s) => s.moduleId === id) || item.testCaseCount > 0 || item.defectCount > 0) return fail('This module has submodules, test cases, or defects and cannot be deleted.')
    mockModules.splice(index, 1)
    return ok(null, 'Module deleted successfully.')
  },
  async getSubmodules(projectId: string, moduleId: string): Promise<ApiResponse<SubmoduleRecord[]>> {
    await mockDelay()
    return ok(mockSubmodules.filter((s) => s.projectId === projectId && s.moduleId === moduleId).map((s) => ({ ...s })))
  },
  async createSubmodule(projectId: string, moduleId: string, payload: Pick<SubmoduleRecord, 'name' | 'description'>): Promise<ApiResponse<SubmoduleRecord>> {
    await mockDelay()
    const name = tidy(payload.name)
    if (!name) return fail('Submodule Name is required.')
    if (mockSubmodules.some((s) => s.moduleId === moduleId && s.name.toLowerCase() === name.toLowerCase())) return fail('Submodule Name must be unique within the selected module.')
    const item: SubmoduleRecord = { id: `sub-${nextSubmodule++}`, projectId, moduleId, name, description: tidy(payload.description), developerEmployeeIds: [], testCaseCount: 0, defectCount: 0 }
    mockSubmodules.push(item)
    const module = mockModules.find((m) => m.id === moduleId); if (module) module.submoduleCount += 1
    return ok({ ...item }, 'Submodule created successfully.')
  },
  async updateSubmodule(id: string, payload: Pick<SubmoduleRecord, 'name' | 'description'>): Promise<ApiResponse<SubmoduleRecord>> {
    await mockDelay()
    const item = mockSubmodules.find((s) => s.id === id)
    if (!item) return fail('Submodule not found.')
    const name = tidy(payload.name)
    if (!name) return fail('Submodule Name is required.')
    if (mockSubmodules.some((s) => s.moduleId === item.moduleId && s.id !== id && s.name.toLowerCase() === name.toLowerCase())) return fail('Submodule Name must be unique within the selected module.')
    item.name = name; item.description = tidy(payload.description)
    return ok({ ...item }, 'Submodule updated successfully.')
  },
  async deleteSubmodule(id: string): Promise<ApiResponse<null>> {
    await mockDelay()
    const index = mockSubmodules.findIndex((s) => s.id === id)
    if (index < 0) return fail('Submodule not found.')
    const item = mockSubmodules[index]
    if (item.testCaseCount > 0 || item.defectCount > 0) return fail('This submodule contains test cases or defects and cannot be deleted.')
    mockSubmodules.splice(index, 1)
    const module = mockModules.find((m) => m.id === item.moduleId); if (module) module.submoduleCount = Math.max(0, module.submoduleCount - 1)
    return ok(null, 'Submodule deleted successfully.')
  },
  async getAvailableQa(projectId: string) { await mockDelay(); return ok(availableMembers(projectId, ['QA', 'QA_LEAD'])) },
  async getAvailableDevelopers(projectId: string) { await mockDelay(); return ok(availableMembers(projectId, ['DEVELOPER'])) },
  async assignQa(moduleId: string, employeeIds: string[]) { await mockDelay(); const item = mockModules.find((m) => m.id === moduleId); if (!item) return fail<ModuleRecord>('Module not found.'); item.qaEmployeeIds = [...new Set(employeeIds)]; return ok({ ...item }, 'Module QA members updated successfully.') },
  async assignDevelopers(submoduleId: string, employeeIds: string[]) { await mockDelay(); const item = mockSubmodules.find((s) => s.id === submoduleId); if (!item) return fail<SubmoduleRecord>('Submodule not found.'); item.developerEmployeeIds = [...new Set(employeeIds)]; return ok({ ...item }, 'Submodule developers updated successfully.') },
}
