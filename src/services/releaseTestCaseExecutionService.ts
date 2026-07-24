import { ApiResponse, Page, PageRequest } from '@/types/common'
import { DefectRecord } from '@/types/defect'
import { ReleaseRecord } from '@/types/release'
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
import { apiRequest, fail, ok } from './apiClient'
import { defectService } from './defectService'
import { employeeService } from './employeeService'
import { moduleManagementService } from './moduleManagementService'
import { releaseService } from './releaseService'
import { mapReleaseTestCase } from './releaseTestCaseService'

type Json = Record<string, any>
type BackendPage = {
  content?: Json[]
  items?: Json[]
  pageNumber?: number
  pageSize?: number
  number?: number
  size?: number
  totalElements?: number
  totalItems?: number
  totalPages?: number
}

const endpoint = (projectId: string) =>
  `/projects/${encodeURIComponent(projectId)}/testcase-allocations`

const query = (
  releaseId: string,
  filters: ReleaseTestCaseExecutionFilters,
  request: PageRequest,
  assignedQaId?: string,
) => ({
  releaseId,
  search: request.search?.trim() || undefined,
  moduleId: filters.moduleId || undefined,
  submoduleId: filters.submoduleId || undefined,
  defectTypeId: filters.defectTypeId || undefined,
  severityId: filters.severityId || undefined,
  executionStatus: filters.status || undefined,
  assignedQaId: assignedQaId || filters.assignedQaId || undefined,
  defectCreated: filters.defectCreated || undefined,
  defectNo: filters.defectNo?.trim() || undefined,
  pageNumber: request.pageNumber,
  pageSize: request.pageSize,
  sortBy: request.sortBy,
  sortDir: request.sortDir,
})

const mapPage = (projectId: string, source: BackendPage | Json[], request: PageRequest): Page<ReleaseTestCaseRecord> => {
  const content = Array.isArray(source) ? source : source.content ?? source.items ?? []
  const pageSize = Array.isArray(source) ? request.pageSize : source.pageSize ?? source.size ?? request.pageSize
  const pageNumber = Array.isArray(source) ? request.pageNumber : source.pageNumber ?? source.number ?? request.pageNumber
  const totalElements = Array.isArray(source) ? content.length : source.totalElements ?? source.totalItems ?? content.length
  return {
    content: content.map((item) => mapReleaseTestCase(item, projectId)),
    pageNumber,
    pageSize,
    totalElements,
    totalPages: Array.isArray(source)
      ? Math.max(1, Math.ceil(totalElements / pageSize))
      : source.totalPages ?? Math.max(1, Math.ceil(totalElements / pageSize)),
  }
}

const list = async (
  projectId: string,
  releaseId: string,
  filters: ReleaseTestCaseExecutionFilters,
  request: PageRequest,
  assignedQaId?: string,
): Promise<ApiResponse<Page<ReleaseTestCaseRecord>>> => {
  const response = await apiRequest<BackendPage | Json[]>(endpoint(projectId), {
    query: query(releaseId, filters, request, assignedQaId),
  })
  return response.success ? ok(mapPage(projectId, response.data, request), response.message) : fail(response.message)
}

const loadAll = (
  projectId: string,
  releaseId: string,
  assignedQaId?: string,
) => list(projectId, releaseId, {}, { pageNumber: 0, pageSize: 1000 }, assignedQaId)

export const releaseTestCaseExecutionService = {
  async getActiveRelease(projectId: string): Promise<ApiResponse<ReleaseRecord | null>> {
    const response = await releaseService.getReleases({
      pageNumber: 0,
      pageSize: 100,
      filters: { projectId, status: 'ACTIVE' },
    })
    if (!response.success) return fail(response.message)
    return ok(response.data.content.find((release) => release.status === 'ACTIVE') ?? null, response.message)
  },

  getMyReleaseTestCaseExecutions(
    projectId: string,
    releaseId: string,
    employeeId: string,
    filters: ReleaseTestCaseExecutionFilters,
    request: PageRequest,
  ) {
    return list(projectId, releaseId, filters, request, employeeId)
  },

  getAllReleaseTestCaseExecutions(
    projectId: string,
    releaseId: string,
    filters: ReleaseTestCaseExecutionFilters,
    request: PageRequest,
  ) {
    return list(projectId, releaseId, filters, request)
  },

  async getReleaseTestCaseExecutionCounts(
    projectId: string,
    releaseId: string,
    employeeId: string,
  ): Promise<ApiResponse<ReleaseTestCaseExecutionCounts>> {
    const [mine, all] = await Promise.all([
      loadAll(projectId, releaseId, employeeId),
      loadAll(projectId, releaseId),
    ])
    if (!mine.success) return fail(mine.message)
    if (!all.success) return fail(all.message)
    return ok({ myTestCases: mine.data.totalElements, allTestCases: all.data.totalElements }, all.message)
  },

  async getReleaseTestCaseExecutionSummary(
    projectId: string,
    releaseId: string,
    employeeId: string,
  ): Promise<ApiResponse<ReleaseTestCaseExecutionSummary>> {
    const response = await loadAll(projectId, releaseId)
    if (!response.success) return fail(response.message)
    const items = response.data.content
    return ok({
      total: response.data.totalElements,
      myAssigned: items.filter((item) => item.assignedQaId === employeeId).length,
      notStarted: items.filter((item) => item.status === 'NOT_STARTED').length,
      passed: items.filter((item) => item.status === 'PASSED').length,
      failed: items.filter((item) => item.status === 'FAILED').length,
      defectsCreated: items.filter((item) => Boolean(item.defectId)).length,
    }, response.message)
  },

  async patchReleaseTestCaseStatus(
    projectId: string,
    releaseTestCaseId: string,
    payload: PatchReleaseTestCaseStatusPayload,
  ): Promise<ApiResponse<ReleaseTestCaseRecord>> {
    const response = await apiRequest<Json>(
      `${endpoint(projectId)}/${encodeURIComponent(releaseTestCaseId)}/status`,
      {
        method: 'PATCH',
        body: { status: payload.status, version: payload.version },
      },
    )
    return response.success
      ? ok(mapReleaseTestCase(response.data, projectId), response.message)
      : fail(response.message)
  },

  async getEligibleSubmoduleDevelopers(
    projectId: string,
    submoduleId: string,
  ): Promise<ApiResponse<EligibleSubmoduleDeveloper[]>> {
    const [submodules, developers] = await Promise.all([
      moduleManagementService.getSubmodules(projectId),
      employeeService.getProjectDevelopers(projectId),
    ])
    if (!submodules.success) return fail(submodules.message)
    if (!developers.success) return fail(developers.message)
    const submodule = submodules.data.find((item) => item.id === submoduleId)
    if (!submodule) return fail('Submodule not found.')
    const assignedIds = new Set(submodule.developerEmployeeIds)
    return ok(developers.data
      .filter((employee) => assignedIds.has(String(employee.id)))
      .map((employee) => ({
        employeeId: String(employee.id),
        employeeName: employee.fullName,
        roleName: employee.designationName || 'Developer',
        allocationPercentage: 0,
        startDate: '',
        endDate: '',
      })), developers.message)
  },

  async failReleaseTestCaseAndCreateDefect(
    projectId: string,
    releaseTestCaseId: string,
    payload: FailReleaseTestCasePayload,
  ): Promise<ApiResponse<FailReleaseTestCaseResult>> {
    const body = new FormData()
    body.append('priorityId', String(Number(payload.priorityId)))
    body.append('assignedToId', String(Number(payload.assignedToId)))
    body.append('version', String(payload.version))
    if (payload.attachment) body.append('attachment', payload.attachment, payload.attachment.name)
    const response = await apiRequest<Json>(
      `${endpoint(projectId)}/${encodeURIComponent(releaseTestCaseId)}/fail`,
      { method: 'POST', body },
    )
    if (!response.success) return fail(response.message)
    const allocationSource = response.data.allocation ?? response.data.releaseTestCaseAllocation ?? response.data
    return ok({
      allocation: mapReleaseTestCase(allocationSource, projectId),
      defectId: String(response.data.defectId ?? allocationSource.defectId ?? ''),
      defectNo: String(response.data.defectNo ?? allocationSource.defectNo ?? ''),
    }, response.message)
  },

  getDefectDetails(projectId: string, defectId: string): Promise<ApiResponse<DefectRecord>> {
    return defectService.getDefectById(projectId, defectId)
  },
}
