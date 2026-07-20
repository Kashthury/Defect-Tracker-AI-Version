import { mockReleaseTestCases } from '@/mock/releaseTestCases'
import { mockReleases } from '@/mock/releases'
import { mockSubmodules } from '@/mock/moduleManagement'
import { mockProjectAllocations } from '@/mock/projectAllocations'
import { mockRoles } from '@/mock/roles'
import { mockEmployeeRecords } from '@/mock/employees'
import { mockPriorities } from '@/mock/configuration'
import { mockDefects } from '@/mock/defects'
import { allocateDefectNumber, defectService } from './defectService'
import { ApiResponse, Page, PageRequest } from '@/types/common'
import { DefectRecord } from '@/types/defect'
import {
  EligibleSubmoduleDeveloper,
  FailReleaseTestCasePayload,
  FailReleaseTestCaseResult,
  PatchReleaseTestCaseStatusPayload,
  ReleaseTestCaseExecutionCounts,
  ReleaseTestCaseExecutionFilters,
  ReleaseTestCaseExecutionSummary,
  ReleaseTestCaseRecord,
} from '@/types/releaseTestCase'
import { fail, mockDelay, ok, paginate } from './apiClient'

/** Conceptual outbound-email log for the DEFECT_ASSIGNED notification trigger. */
export const mockDefectAssignedEmailLog: { defectId: string; defectNo: string; assignedToId: string; sentAt: string }[] = []

function baseScope(projectId: string, releaseId: string): ReleaseTestCaseRecord[] {
  return mockReleaseTestCases.filter((r) => r.projectId === projectId && r.releaseId === releaseId && r.active)
}

function applyFilters(rows: ReleaseTestCaseRecord[], filters: ReleaseTestCaseExecutionFilters | undefined, search: string | undefined): ReleaseTestCaseRecord[] {
  let result = rows
  if (search && search.trim()) {
    const term = search.trim().toLowerCase()
    result = result.filter((r) => r.testCaseKey.toLowerCase().includes(term) || r.description.toLowerCase().includes(term))
  }
  if (!filters) return result
  if (filters.moduleId) result = result.filter((r) => r.moduleId === filters.moduleId)
  if (filters.submoduleId) result = result.filter((r) => r.submoduleId === filters.submoduleId)
  if (filters.defectTypeId) result = result.filter((r) => r.defectTypeId === filters.defectTypeId)
  if (filters.severityId) result = result.filter((r) => r.severityId === filters.severityId)
  if (filters.status) result = result.filter((r) => r.status === filters.status)
  if (filters.assignedQaId) result = result.filter((r) => r.assignedQaId === filters.assignedQaId)
  if (filters.defectCreated === 'YES') result = result.filter((r) => Boolean(r.defectId))
  if (filters.defectCreated === 'NO') result = result.filter((r) => !r.defectId)
  if (filters.defectNo && filters.defectNo.trim()) {
    const term = filters.defectNo.trim().toLowerCase()
    result = result.filter((r) => (r.defectNo ?? '').toLowerCase().includes(term))
  }
  return result
}

function toPage(rows: ReleaseTestCaseRecord[], request: PageRequest): Page<ReleaseTestCaseRecord> {
  // Search/filters are already applied above; hand the pre-filtered rows to the
  // generic paginator purely for sort + slice so behaviour matches every other list.
  return paginate(rows, { ...request, search: '', filters: {} }, [])
}

function eligibleSubmoduleDevelopers(projectId: string, submoduleId: string, executionDate: string): EligibleSubmoduleDeveloper[] {
  const submodule = mockSubmodules.find((s) => s.id === submoduleId && s.projectId === projectId)
  if (!submodule) return []
  const ids = new Set(submodule.developerEmployeeIds)
  return mockProjectAllocations
    .filter((a) => a.projectId === projectId && a.status === 'ACTIVE' && ids.has(a.employeeId))
    .filter((a) => a.startDate <= executionDate && a.endDate >= executionDate)
    .map((a) => {
      const role = mockRoles.find((r) => r.id === a.roleId)
      const employee = mockEmployeeRecords.find((e) => e.id === a.employeeId)
      if (!role || role.roleType !== 'DEVELOPER' || !employee || employee.status !== 'ACTIVE') return null
      return {
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        roleName: role.name,
        allocationPercentage: a.allocationPercentage,
        startDate: a.startDate,
        endDate: a.endDate,
      }
    })
    .filter((item): item is EligibleSubmoduleDeveloper => Boolean(item))
}

export const releaseTestCaseExecutionService = {
  /** The ACTIVE release for a project, or null when none exists — execution is gated on this. */
  async getActiveRelease(projectId: string) {
    await mockDelay(150)
    const release = mockReleases.find((r) => r.projectId === projectId && r.status === 'ACTIVE')
    return ok(release ? { ...release } : null)
  },

  async getMyReleaseTestCaseExecutions(
    projectId: string,
    releaseId: string,
    employeeId: string,
    filters: ReleaseTestCaseExecutionFilters,
    request: PageRequest,
  ): Promise<ApiResponse<Page<ReleaseTestCaseRecord>>> {
    await mockDelay()
    const scoped = baseScope(projectId, releaseId).filter((r) => r.assignedQaId === employeeId)
    return ok(toPage(applyFilters(scoped, filters, request.search), request))
  },

  async getAllReleaseTestCaseExecutions(
    projectId: string,
    releaseId: string,
    filters: ReleaseTestCaseExecutionFilters,
    request: PageRequest,
  ): Promise<ApiResponse<Page<ReleaseTestCaseRecord>>> {
    await mockDelay()
    const scoped = baseScope(projectId, releaseId)
    return ok(toPage(applyFilters(scoped, filters, request.search), request))
  },

  async getReleaseTestCaseExecutionCounts(
    projectId: string,
    releaseId: string,
    employeeId: string,
  ): Promise<ApiResponse<ReleaseTestCaseExecutionCounts>> {
    await mockDelay(120)
    const scoped = baseScope(projectId, releaseId)
    return ok({
      myTestCases: scoped.filter((r) => r.assignedQaId === employeeId).length,
      allTestCases: scoped.length,
    })
  },

  /**
   * Additive, read-only dashboard summary for the Execution page header
   * cards. Reuses the same scoping rules as the existing counts endpoint —
   * it does not alter any existing method, validation, or contract.
   */
  async getReleaseTestCaseExecutionSummary(
    projectId: string,
    releaseId: string,
    employeeId: string,
  ): Promise<ApiResponse<ReleaseTestCaseExecutionSummary>> {
    await mockDelay(120)
    const scoped = baseScope(projectId, releaseId)
    return ok({
      total: scoped.length,
      myAssigned: scoped.filter((r) => r.assignedQaId === employeeId).length,
      notStarted: scoped.filter((r) => r.status === 'NOT_STARTED').length,
      passed: scoped.filter((r) => r.status === 'PASSED').length,
      failed: scoped.filter((r) => r.status === 'FAILED').length,
      defectsCreated: scoped.filter((r) => Boolean(r.defectId)).length,
    })
  },

  async patchReleaseTestCaseStatus(
    releaseTestCaseId: string,
    payload: PatchReleaseTestCaseStatusPayload,
  ): Promise<ApiResponse<ReleaseTestCaseRecord>> {
    await mockDelay(350)
    const index = mockReleaseTestCases.findIndex((r) => r.id === releaseTestCaseId && r.active)
    if (index === -1) return fail('This test case allocation was not found.')
    const current = mockReleaseTestCases[index]
    if (current.version !== payload.version) return fail('This record was updated elsewhere. Refresh and try again.')
    if (current.assignedQaId !== payload.executedBy) return fail('Only the QA assigned to this allocation may execute it.')
    if (current.status !== 'NOT_STARTED') return fail(`A ${current.status} test case cannot be marked PASSED.`)

    const executor = mockEmployeeRecords.find((e) => e.id === payload.executedBy)
    const updated: ReleaseTestCaseRecord = {
      ...current,
      status: 'PASSED',
      executedById: payload.executedBy,
      executedByName: executor ? `${executor.firstName} ${executor.lastName}` : current.assignedQaName,
      executedDate: new Date().toISOString().slice(0, 10),
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    }
    mockReleaseTestCases[index] = updated
    return ok({ ...updated }, `${updated.testCaseKey} marked PASSED.`)
  },

  async getEligibleSubmoduleDevelopers(
    projectId: string,
    submoduleId: string,
    executionDate: string = new Date().toISOString().slice(0, 10),
  ): Promise<ApiResponse<EligibleSubmoduleDeveloper[]>> {
    await mockDelay(150)
    return ok(eligibleSubmoduleDevelopers(projectId, submoduleId, executionDate))
  },

  async failReleaseTestCaseAndCreateDefect(
    releaseTestCaseId: string,
    payload: FailReleaseTestCasePayload,
  ): Promise<ApiResponse<FailReleaseTestCaseResult>> {
    await mockDelay(500)
    const index = mockReleaseTestCases.findIndex((r) => r.id === releaseTestCaseId && r.active)
    if (index === -1) return fail('This test case allocation was not found.')
    const current = mockReleaseTestCases[index]

    const release = mockReleases.find((r) => r.id === current.releaseId && r.projectId === current.projectId)
    if (!release || release.status !== 'ACTIVE') return fail('This allocation does not belong to the currently ACTIVE release.')
    if (current.version !== payload.version) return fail('This record was updated elsewhere. Refresh and try again.')
    if (current.assignedQaId !== payload.executedBy) return fail('Only the QA assigned to this allocation may execute it.')
    if (current.status === 'FAILED') return fail('This test case has already failed and a defect has already been created.')
    if (current.defectId) return fail('A defect is already linked to this allocation.')

    const priority = mockPriorities.find((p) => p.id === payload.priorityId && p.active)
    if (!priority) return fail('Select a valid Priority.')

    const executionDate = new Date().toISOString().slice(0, 10)
    const developer = eligibleSubmoduleDevelopers(current.projectId, current.submoduleId, executionDate).find(
      (d) => d.employeeId === payload.assignedToId,
    )
    if (!developer) return fail('Select a Developer who is assigned to this Submodule and actively allocated to the project.')

    // All validations passed — commit the transaction: create the Defect, link it, then flip the allocation to FAILED.
    const { id: defectId, defectNo } = allocateDefectNumber()
    const now = new Date().toISOString()
    const defect: DefectRecord = {
      id: defectId,
      defectNo,
      projectId: current.projectId,
      moduleId: current.moduleId,
      moduleName: current.moduleName,
      submoduleId: current.submoduleId,
      submoduleName: current.submoduleName,
      defectTypeId: current.defectTypeId,
      defectTypeName: current.defectTypeName,
      severityId: current.severityId,
      severityName: current.severityName,
      severityColor: current.severityColor,
      priorityId: priority.id,
      priorityName: priority.name,
      priorityColor: priority.color,
      releaseId: release.id,
      releaseName: release.name,
      description: current.description,
      recreationSteps: current.steps,
      attachmentName: payload.attachmentName ?? current.attachmentName,
      statusCode: 'NEW',
      statusName: 'New',
      assignedToId: developer.employeeId,
      assignedToName: developer.employeeName,
      enteredById: payload.executedBy,
      enteredByName: current.assignedQaName ?? payload.executedBy,
      testCaseRequired: true,
      linkedTestCaseId: current.testCaseId,
      linkedTestCaseNo: current.testCaseKey,
      createdAt: now,
      updatedAt: now,
    }
    mockDefects.unshift(defect)
    mockDefectAssignedEmailLog.push({ defectId: defect.id, defectNo: defect.defectNo, assignedToId: developer.employeeId, sentAt: now })

    const updated: ReleaseTestCaseRecord = {
      ...current,
      status: 'FAILED',
      executedById: payload.executedBy,
      executedByName: current.assignedQaName,
      executedDate: executionDate,
      defectId: defect.id,
      defectNo: defect.defectNo,
      defectAssignedToId: developer.employeeId,
      defectAssignedToName: developer.employeeName,
      version: current.version + 1,
      updatedAt: now,
    }
    mockReleaseTestCases[index] = updated

    return ok({ allocation: { ...updated }, defectId: defect.id, defectNo: defect.defectNo }, `${updated.testCaseKey} marked FAILED and ${defect.defectNo} created.`)
  },

  async getDefectDetails(projectId: string, defectId: string): Promise<ApiResponse<DefectRecord>> {
    return defectService.getDefectById(projectId, defectId)
  },
}
