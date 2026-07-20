export interface TestCaseRecord {
  id: string
  testCaseNo: string
  projectId: string
  moduleId: string
  moduleName: string
  submoduleId: string
  submoduleName: string
  defectTypeId: string
  defectTypeName: string
  severityId: string
  severityName: string
  severityColor: string
  description: string
  steps: string
  createdAt: string
  updatedAt: string
  allocatedReleaseCount: number
  hasExecutionHistory: boolean
}

export interface TestCasePayload {
  moduleId: string
  submoduleId: string
  defectTypeId: string
  severityId: string
  description: string
  steps: string
}

export interface TestCaseImportRow {
  rowNumber: number
  moduleName: string
  submoduleName: string
  defectTypeName: string
  severityName: string
  description: string
  steps: string
  valid: boolean
  errors: string[]
}

export interface TestCaseImportValidation {
  rows: TestCaseImportRow[]
  validCount: number
  invalidCount: number
}
