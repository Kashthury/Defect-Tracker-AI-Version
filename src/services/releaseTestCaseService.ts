import { mockTestCases } from '@/mock/testCases'
import { mockReleases } from '@/mock/releases'
import { mockReleaseTestCases } from '@/mock/releaseTestCases'
import { mockEmployeeRecords } from '@/mock/employees'
import { AllocationResult, ReleaseTestCaseRecord } from '@/types/releaseTestCase'
import { TestCase } from '@/types/defect'
import { ApiResponse } from '@/types/common'
import { mockDelay, ok } from './apiClient'

let nextId = mockReleaseTestCases.length + 1

function enrich(projectId: string, releaseId: string, testCaseId: string): ReleaseTestCaseRecord {
  const testCase = mockTestCases.find((t) => t.id === testCaseId)!
  const release = mockReleases.find((r) => r.id === releaseId)!
  const now = new Date().toISOString()
  return {
    id: `rtc-${nextId++}`,
    projectId,
    releaseId,
    releaseName: release.name,
    releaseVersion: release.version,
    testCaseId,
    testCaseKey: testCase.testCaseNo,
    title: testCase.description,
    description: testCase.description,
    steps: testCase.steps,
    moduleId: testCase.moduleId,
    moduleName: testCase.moduleName,
    submoduleId: testCase.submoduleId,
    submoduleName: testCase.submoduleName,
    defectTypeId: testCase.defectTypeId,
    defectTypeName: testCase.defectTypeName,
    severityId: testCase.severityId,
    severityName: testCase.severityName,
    severityColor: testCase.severityColor,
    status: 'NOT_STARTED',
    version: 1,
    active: true,
    createdAt: now,
    updatedAt: now,
  }
}

export const releaseTestCaseService = {
  /** Master test cases available for a project, for the Allocation picker only. */
  async getProjectTestCases(projectId: string): Promise<ApiResponse<TestCase[]>> {
    await mockDelay()
    const rows: TestCase[] = mockTestCases
      .filter((t) => t.projectId === projectId)
      .map((t) => ({
        id: t.id,
        testCaseKey: t.testCaseNo,
        title: t.description,
        projectId: t.projectId,
        projectName: '',
        moduleName: t.moduleName,
        priority: 'P2',
        status: 'Not Executed',
        lastExecutedBy: '',
        lastExecutedAt: null,
      }))
    return ok(rows)
  },

  async getAllocated(projectId: string, releaseId?: string): Promise<ApiResponse<ReleaseTestCaseRecord[]>> {
    await mockDelay()
    return ok(
      mockReleaseTestCases
        .filter((r) => r.projectId === projectId && r.active && (!releaseId || r.releaseId === releaseId))
        .map((r) => ({ ...r })),
    )
  },

  async allocate(projectId: string, releaseIds: string[], testCaseIds: string[]): Promise<ApiResponse<AllocationResult>> {
    await mockDelay(500)
    let allocated = 0
    let skipped = 0
    for (const releaseId of releaseIds) {
      for (const testCaseId of testCaseIds) {
        if (mockReleaseTestCases.some((r) => r.releaseId === releaseId && r.testCaseId === testCaseId && r.active)) {
          skipped += 1
          continue
        }
        mockReleaseTestCases.push(enrich(projectId, releaseId, testCaseId))
        allocated += 1
      }
    }
    return ok(
      { requested: releaseIds.length * testCaseIds.length, allocated, skipped },
      `${allocated} allocated, ${skipped} already existed and were skipped.`,
    )
  },

  async assignQa(ids: string[], employeeId: string): Promise<ApiResponse<null>> {
    await mockDelay()
    const employee = mockEmployeeRecords.find((e) => e.id === employeeId)
    mockReleaseTestCases.forEach((r) => {
      if (ids.includes(r.id) && r.status === 'NOT_STARTED') {
        r.assignedQaId = employeeId
        r.assignedQaName = employee ? `${employee.firstName} ${employee.lastName}` : employeeId
      }
    })
    return ok(null, 'QA assignment updated successfully.')
  },
}
