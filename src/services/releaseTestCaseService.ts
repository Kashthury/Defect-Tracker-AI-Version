import { ApiResponse } from '@/types/common'
import { TestCaseRecord } from '@/types/testCase'
import { AllocationMode, AllocationResult, ReleaseTestCaseRecord } from '@/types/releaseTestCase'
import { apiRequest, fail, ok } from './apiClient'
import { testCaseService } from './testCaseService'

type Json = Record<string, any>

const text = (...values: unknown[]) => String(values.find((value) => value !== undefined && value !== null) ?? '')
const rows = (value: Json[] | { content?: Json[]; items?: Json[] }) =>
  Array.isArray(value) ? value : value.content ?? value.items ?? []

export const mapReleaseTestCase = (source: Json, projectId: string): ReleaseTestCaseRecord => ({
  id: text(source.id, source.allocationId, source.releaseTestCaseAllocationId),
  projectId: text(source.projectId, projectId),
  releaseId: text(source.releaseId),
  releaseName: text(source.releaseName),
  releaseVersion: text(source.releaseVersion, source.version),
  testCaseId: text(source.testCaseId),
  testCaseKey: text(source.testCaseNo, source.testCaseKey),
  title: text(source.title, source.description),
  description: text(source.description),
  steps: text(source.steps, source.recreationSteps),
  moduleId: text(source.moduleId),
  moduleName: text(source.moduleName),
  submoduleId: text(source.submoduleId, source.subModuleId),
  submoduleName: text(source.submoduleName, source.subModuleName),
  defectTypeId: text(source.defectTypeId),
  defectTypeName: text(source.defectTypeName),
  severityId: text(source.severityId),
  severityName: text(source.severityName),
  severityColor: text(source.severityColor, '#64748B'),
  attachmentName: source.attachmentName ? String(source.attachmentName) : undefined,
  status: source.status === 'PASSED' || source.status === 'FAILED' ? source.status : 'NOT_STARTED',
  assignedQaId: source.assignedQaId != null ? String(source.assignedQaId) : undefined,
  assignedQaName: source.assignedQaName ? String(source.assignedQaName) : undefined,
  executedById: source.executedById != null ? String(source.executedById) : undefined,
  executedByName: source.executedByName ? String(source.executedByName) : undefined,
  executedDate: source.executedDate ? String(source.executedDate) : undefined,
  defectId: source.defectId != null ? String(source.defectId) : undefined,
  defectNo: source.defectNo ? String(source.defectNo) : undefined,
  defectAssignedToId: source.defectAssignedToId != null ? String(source.defectAssignedToId) : undefined,
  defectAssignedToName: source.defectAssignedToName ? String(source.defectAssignedToName) : undefined,
  version: Number(source.version ?? 0),
  active: source.active !== false,
  createdAt: text(source.createdAt),
  updatedAt: text(source.updatedAt),
})

const endpoint = (projectId: string) =>
  `/projects/${encodeURIComponent(projectId)}/testcase-allocations`

export const releaseTestCaseService = {
  async getProjectTestCases(projectId: string): Promise<ApiResponse<TestCaseRecord[]>> {
    const response = await testCaseService.getTestCases(projectId, {
      pageNumber: 0,
      pageSize: 1000,
      sortBy: 'testCaseNo',
      sortDir: 'asc',
    })
    return response.success ? ok(response.data.content, response.message) : fail(response.message)
  },

  async getAllocated(projectId: string, releaseId?: string): Promise<ApiResponse<ReleaseTestCaseRecord[]>> {
    const response = await apiRequest<Json[] | { content?: Json[]; items?: Json[] }>(endpoint(projectId), {
      query: { releaseId, pageNumber: 0, pageSize: 1000 },
    })
    return response.success
      ? ok(rows(response.data).map((item) => mapReleaseTestCase(item, projectId)), response.message)
      : fail(response.message)
  },

  async allocate(
    projectId: string,
    releaseIds: string[],
    testCaseIds: string[],
    allocationMode: AllocationMode,
  ): Promise<ApiResponse<AllocationResult>> {
    let allocated = 0
    let skipped = 0
    let message = 'Test Cases allocated successfully.'
    for (const releaseId of releaseIds) {
      const response = await apiRequest<Json>(endpoint(projectId), {
        method: 'POST',
        body: {
          releaseId: Number(releaseId),
          testCaseIds: testCaseIds.map(Number),
          allocationMode,
        },
      })
      if (!response.success) return fail(response.message)
      allocated += Number(response.data.allocated ?? response.data.allocatedCount ?? 0)
      skipped += Number(response.data.skipped ?? response.data.skippedCount ?? 0)
      message = response.message
    }
    return ok({
      requested: releaseIds.length * testCaseIds.length,
      allocated,
      skipped,
    }, message)
  },

  assignQa(projectId: string, allocationIds: string[], qaEmployeeId: string): Promise<ApiResponse<null>> {
    return apiRequest(`${endpoint(projectId)}/qa`, {
      method: 'PATCH',
      body: {
        allocationIds: allocationIds.map(Number),
        qaEmployeeId: Number(qaEmployeeId),
      },
    })
  },
}
