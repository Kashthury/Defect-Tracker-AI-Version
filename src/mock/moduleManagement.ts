import { ModuleRecord, SubmoduleRecord } from '@/types/moduleManagement'

export const mockModules: ModuleRecord[] = [
  { id: 'mod-1', projectId: 'proj-1', name: 'Settlement Engine', description: 'Settlement lifecycle and reconciliation.', qaEmployeeIds: ['emp-0001', 'emp-0003'], submoduleCount: 2, testCaseCount: 48, defectCount: 7 },
  { id: 'mod-2', projectId: 'proj-1', name: 'Card Authorization', description: 'Real-time authorization and risk checks.', qaEmployeeIds: ['emp-0003'], submoduleCount: 2, testCaseCount: 36, defectCount: 4 },
  { id: 'mod-3', projectId: 'proj-2', name: 'KYC Checks', description: 'Identity verification and screening.', qaEmployeeIds: ['emp-0007'], submoduleCount: 2, testCaseCount: 31, defectCount: 5 },
  { id: 'mod-4', projectId: 'proj-3', name: 'Account Overview', description: 'Mobile account summary and balances.', qaEmployeeIds: ['emp-0005', 'emp-0007'], submoduleCount: 2, testCaseCount: 42, defectCount: 6 },
]

export const mockSubmodules: SubmoduleRecord[] = [
  { id: 'sub-1', projectId: 'proj-1', moduleId: 'mod-1', name: 'Settlement Posting', description: 'Posting and ledger entries.', developerEmployeeIds: ['emp-0004'], testCaseCount: 24, defectCount: 4 },
  { id: 'sub-2', projectId: 'proj-1', moduleId: 'mod-1', name: 'Reconciliation', description: 'Reconciliation rules and exception handling.', developerEmployeeIds: ['emp-0004'], testCaseCount: 24, defectCount: 3 },
  { id: 'sub-3', projectId: 'proj-1', moduleId: 'mod-2', name: 'Card Validation', description: 'Card, limit and merchant validations.', developerEmployeeIds: ['emp-0004'], testCaseCount: 18, defectCount: 2 },
  { id: 'sub-4', projectId: 'proj-1', moduleId: 'mod-2', name: 'Authorization Routing', description: 'Issuer routing and response handling.', developerEmployeeIds: ['emp-0004'], testCaseCount: 18, defectCount: 2 },
  { id: 'sub-5', projectId: 'proj-2', moduleId: 'mod-3', name: 'Document Verification', description: 'Document upload and validation.', developerEmployeeIds: [], testCaseCount: 16, defectCount: 3 },
  { id: 'sub-6', projectId: 'proj-2', moduleId: 'mod-3', name: 'Risk Screening', description: 'AML and sanctions screening.', developerEmployeeIds: [], testCaseCount: 15, defectCount: 2 },
  { id: 'sub-7', projectId: 'proj-3', moduleId: 'mod-4', name: 'Balance Summary', description: 'Balances and pending transactions.', developerEmployeeIds: ['emp-0004'], testCaseCount: 22, defectCount: 3 },
  { id: 'sub-8', projectId: 'proj-3', moduleId: 'mod-4', name: 'Recent Activity', description: 'Recent transaction activity.', developerEmployeeIds: ['emp-0004'], testCaseCount: 20, defectCount: 3 },
]
