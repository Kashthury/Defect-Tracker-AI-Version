export type ReleaseTestCaseStatus = 'NOT_STARTED' | 'PASSED' | 'FAILED'
export type AllocationMode = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'BULK' | 'MANY_TO_MANY'

/**
 * A release-test-case allocation: the join record between a release and a
 * master Test Case. This — not the master Test Case record — is the source
 * of truth for execution status, assigned QA, execution history, and the
 * linked defect for that specific release. The same testCaseId may have an
 * independent allocation row (with its own status/QA/defect) in another
 * release.
 */
export interface ReleaseTestCaseRecord {
  id: string
  projectId: string
  releaseId: string
  releaseName: string
  releaseVersion: string
  testCaseId: string
  testCaseKey: string
  title: string
  description: string
  steps: string

  moduleId: string
  moduleName: string
  submoduleId: string
  submoduleName: string

  defectTypeId: string
  defectTypeName: string
  severityId: string
  severityName: string
  severityColor: string

  attachmentName?: string

  status: ReleaseTestCaseStatus
  assignedQaId?: string
  assignedQaName?: string

  executedById?: string
  executedByName?: string
  executedDate?: string

  defectId?: string
  defectNo?: string
  defectAssignedToId?: string
  defectAssignedToName?: string

  /** Optimistic-concurrency version, incremented on every status/assignment change. */
  version: number
  /** False once the test case has been deallocated/removed from this release. */
  active: boolean

  createdAt: string
  updatedAt: string
}

export interface AllocationResult {
  requested: number
  allocated: number
  skipped: number
}

export interface ReleaseTestCaseExecutionFilters {
  moduleId?: string
  submoduleId?: string
  defectTypeId?: string
  severityId?: string
  status?: ReleaseTestCaseStatus | ''
  assignedQaId?: string
  defectCreated?: 'YES' | 'NO' | ''
  defectNo?: string
}

export interface ReleaseTestCaseExecutionCounts {
  myTestCases: number
  allTestCases: number
}

/**
 * Purely-derived, read-only dashboard summary for the Execution page header
 * cards. Additive only — does not change any existing counts contract.
 */
export interface ReleaseTestCaseExecutionSummary {
  total: number
  myAssigned: number
  notStarted: number
  passed: number
  failed: number
  defectsCreated: number
}

export interface PatchReleaseTestCaseStatusPayload {
  status: 'PASSED'
  executedBy: string
  version: number
}

export interface FailReleaseTestCasePayload {
  priorityId: string
  assignedToId: string
  attachmentName?: string
  executedBy: string
  version: number
}

export interface FailReleaseTestCaseResult {
  allocation: ReleaseTestCaseRecord
  defectId: string
  defectNo: string
}

export interface EligibleSubmoduleDeveloper {
  employeeId: string
  employeeName: string
  roleName: string
  allocationPercentage: number
  startDate: string
  endDate: string
}
