import { StatusTypeCode } from '@/constants/statusTypes'

export interface DefectRecord {
  id: string
  defectNo: string
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
  priorityId: string
  priorityName: string
  priorityColor: string
  releaseId: string
  releaseName: string
  description: string
  recreationSteps: string
  attachmentName?: string
  statusCode: StatusTypeCode
  statusName: string
  assignedToId: string
  assignedToName: string
  enteredById: string
  enteredByName: string
  testCaseRequired: boolean
  linkedTestCaseId?: string
  linkedTestCaseNo?: string
  createdAt: string
  updatedAt: string
}

export interface DefectPayload {
  moduleId: string
  submoduleId: string
  defectTypeId: string
  severityId: string
  priorityId: string
  releaseId: string
  description: string
  recreationSteps: string
  attachmentName?: string
  assignedToId: string
  testCaseRequired: boolean
}

export interface DefectHistoryRecord {
  id: string
  defectId: string
  action: 'CREATED' | 'UPDATED' | 'STATUS_CHANGED' | 'REASSIGNED' | 'IMPORTED'
  fromValue?: string
  toValue?: string
  changedBy: string
  changedAt: string
}

export interface DefectImportRow {
  rowNumber: number
  moduleName: string
  submoduleName: string
  defectTypeName: string
  severityName: string
  priorityName: string
  releaseName: string
  description: string
  recreationSteps: string
  assignedToName: string
  testCaseRequired: boolean
  valid: boolean
  errors: string[]
}

export interface DefectImportValidation {
  rows: DefectImportRow[]
  validCount: number
  invalidCount: number
}

export interface DefectTypeConfig { id: string; name: string; description: string; active: boolean; createdAt: string }
export interface ReleaseTypeConfig { id: string; name: string; description: string; active: boolean; createdAt: string }
export interface SeverityConfig { id: string; name: string; description: string; weight: number; color: string; colorTone: 'critical' | 'high' | 'medium' | 'low'; active: boolean; createdAt: string }
export interface PriorityConfig { id: string; name: string; description: string; color: string; active: boolean; createdAt: string }

// Legacy list types retained for existing dashboard/release-allocation mock generators.
export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low'
export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4'
export type DefectStatusName = 'New' | 'Assigned' | 'In Progress' | 'Fixed' | 'Retest' | 'Closed' | 'Reopened'
export interface Defect { id:string; defectKey:string; title:string; projectId:string; projectName:string; releaseName:string; moduleName:string; severity:SeverityLevel; priority:PriorityLevel; statusCode:StatusTypeCode; status:DefectStatusName; defectType:string; reportedBy:string; assignedTo:string; createdAt:string; updatedAt:string }
export interface TestCase { id:string; testCaseKey:string; title:string; projectId:string; projectName:string; moduleName:string; priority:PriorityLevel; status:'Not Executed'|'Passed'|'Failed'|'Blocked'; lastExecutedBy:string; lastExecutedAt:string|null }
