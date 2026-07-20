import { mockTestCases } from './testCases'
import { mockModules } from './moduleManagement'
import { mockReleases } from './releases'
import { mockDefects } from './defects'
import { mockEmployeeRecords } from './employees'
import { ReleaseTestCaseRecord } from '@/types/releaseTestCase'

/**
 * Seed release-test-case allocations for every project's ACTIVE release.
 * These rows — not the master Test Case records — are the source of truth
 * for the Test Case Execution feature: each carries its own status,
 * assigned QA, execution history, and defect link, independent of any
 * other release the same master test case may also be allocated to.
 */
function buildSeed(): ReleaseTestCaseRecord[] {
  const rows: ReleaseTestCaseRecord[] = []
  let sequence = 1

  const activeReleases = mockReleases.filter((release) => release.status === 'ACTIVE')

  activeReleases.forEach((release) => {
    const projectTestCases = mockTestCases.filter((tc) => tc.projectId === release.projectId)
    const allocatedCount = Math.min(projectTestCases.length, 30)

    for (let index = 0; index < allocatedCount; index += 1) {
      const testCase = projectTestCases[index]
      const module = mockModules.find((m) => m.id === testCase.moduleId)
      const assignedQaId = module?.qaEmployeeIds?.[0]
      const qaEmployee = assignedQaId ? mockEmployeeRecords.find((e) => e.id === assignedQaId) : undefined

      const cycle = index % 10
      // Roughly: 60% not started, 30% passed, 10% failed (only when a real linked defect exists).
      let status: ReleaseTestCaseRecord['status'] = 'NOT_STARTED'
      let defect: (typeof mockDefects)[number] | undefined
      if (cycle >= 6 && cycle < 9) status = 'PASSED'
      else if (cycle === 9) {
        defect = mockDefects.find(
          (d) => d.projectId === release.projectId && d.releaseId === release.id && d.moduleId === testCase.moduleId,
        )
        status = defect ? 'FAILED' : 'PASSED'
      }

      const executedDate = status !== 'NOT_STARTED'
        ? new Date(Date.UTC(2026, 6, 1 + (index % 14))).toISOString().slice(0, 10)
        : undefined

      rows.push({
        id: `rtc-${sequence++}`,
        projectId: release.projectId,
        releaseId: release.id,
        releaseName: release.name,
        releaseVersion: release.version,
        testCaseId: testCase.id,
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
        status,
        assignedQaId,
        assignedQaName: qaEmployee ? `${qaEmployee.firstName} ${qaEmployee.lastName}` : undefined,
        executedById: status !== 'NOT_STARTED' ? assignedQaId : undefined,
        executedByName: status !== 'NOT_STARTED' ? qaEmployee ? `${qaEmployee.firstName} ${qaEmployee.lastName}` : undefined : undefined,
        executedDate,
        defectId: defect?.id,
        defectNo: defect?.defectNo,
        defectAssignedToId: defect?.assignedToId,
        defectAssignedToName: defect?.assignedToName,
        version: 1,
        active: true,
        createdAt: release.createdAt,
        updatedAt: release.updatedAt,
      })
    }
  })

  return rows
}

export const mockReleaseTestCases: ReleaseTestCaseRecord[] = buildSeed()
