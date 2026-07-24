import { ApiResponse, Page, PageRequest } from '@/types/common'
import { DefectHistoryRecord, DefectImportRow, DefectImportValidation, DefectPayload, DefectRecord, DefectTypeConfig, PriorityConfig, SeverityConfig } from '@/types/defect'
import { mockDefects, mockDefectHistory } from '@/mock/defects'
import { mockDefectTypes, mockPriorities, mockSeverities, mockStatusTypes } from '@/mock/configuration'
import { mockModules, mockSubmodules } from '@/mock/moduleManagement'
import { mockReleases } from '@/mock/releases'
import { mockEmployeeRecords } from '@/mock/employees'
import { mockTestCases } from '@/mock/testCases'
import { mockDefectWorkflowStore } from '@/mock/defectWorkflow'
import { apiRequest, fail, mockDelay, ok, paginate } from './apiClient'
import { getConfigurationPage } from './configurationApi'
import { employeeService } from './employeeService'
import { statusTypeService } from './statusTypeService'
import { defectWorkflowService } from './defectWorkflowService'
import { STATUS_TYPE_CODES, StatusTypeCode } from '@/constants/statusTypes'
import { StatusTypeRecord } from '@/types/statusType'
import { allocateProjectSequence } from './projectSequenceService'
import { defectTypeService } from './defectTypeService'
import { severityService } from './severityService'
import { priorityService } from './priorityService'

const tidy = (v: string) => v.trim().replace(/\s+/g, ' ')
const defectEndpoint = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/defects`

type BackendDefect = Partial<DefectRecord> & { subModuleId?: string | number; subModuleName?: string }

const mapDefect = (projectId: string, item: BackendDefect): DefectRecord => ({
  id: String(item.id ?? ''), defectNo: String(item.defectNo ?? ''), projectId: String(item.projectId ?? projectId),
  moduleId: String(item.moduleId ?? ''), moduleName: String(item.moduleName ?? ''),
  submoduleId: String(item.submoduleId ?? item.subModuleId ?? ''), submoduleName: String(item.submoduleName ?? item.subModuleName ?? ''),
  defectTypeId: String(item.defectTypeId ?? ''), defectTypeName: String(item.defectTypeName ?? ''),
  severityId: String(item.severityId ?? ''), severityName: String(item.severityName ?? ''), severityColor: String(item.severityColor ?? '#64748B'),
  priorityId: String(item.priorityId ?? ''), priorityName: String(item.priorityName ?? ''), priorityColor: String(item.priorityColor ?? '#64748B'),
  releaseId: String(item.releaseId ?? ''), releaseName: String(item.releaseName ?? ''), description: String(item.description ?? ''),
  recreationSteps: String(item.recreationSteps ?? ''), attachmentName: item.attachmentName,
  statusCode: item.statusCode ?? STATUS_TYPE_CODES.NEW, statusName: String(item.statusName ?? ''),
  assignedToId: String(item.assignedToId ?? ''), assignedToName: String(item.assignedToName ?? ''),
  enteredById: String(item.enteredById ?? ''), enteredByName: String(item.enteredByName ?? ''), testCaseRequired: Boolean(item.testCaseRequired),
  linkedTestCaseId: item.linkedTestCaseId ? String(item.linkedTestCaseId) : undefined, linkedTestCaseNo: item.linkedTestCaseNo,
  createdAt: String(item.createdAt ?? ''), updatedAt: String(item.updatedAt ?? ''),
})

const backendDefectPayload = (payload: DefectPayload) => ({
  moduleId: Number(payload.moduleId), subModuleId: Number(payload.submoduleId), defectTypeId: Number(payload.defectTypeId),
  severityId: Number(payload.severityId), priorityId: Number(payload.priorityId), releaseId: Number(payload.releaseId),
  description: tidy(payload.description), recreationSteps: payload.recreationSteps.trim(), attachmentName: payload.attachmentName,
  assignedToId: Number(payload.assignedToId), testCaseRequired: payload.testCaseRequired,
})

/**
 * Computes the next Defect Number by scanning current records rather than
 * relying on a counter frozen at module load time. This lets any service
 * that mutates the shared `mockDefects` array (e.g. the release test case
 * execution FAIL flow, which creates defects directly) generate a Defect
 * Number that can never collide with one generated here.
 */
export function allocateDefectNumber(projectId: string): { id: string; defectNo: string } {
  return {
    id: `defect-${crypto.randomUUID()}`,
    defectNo: allocateProjectSequence(projectId, 'DEFECT', mockDefects.filter((item) => item.projectId === projectId).map((item) => item.defectNo)),
  }
}
const reassignable = new Set<StatusTypeCode>([
  STATUS_TYPE_CODES.NEW, STATUS_TYPE_CODES.OPEN, STATUS_TYPE_CODES.IN_PROGRESS, STATUS_TYPE_CODES.REOPENED,
  STATUS_TYPE_CODES.REJECTED, STATUS_TYPE_CODES.FIXED, STATUS_TYPE_CODES.DUPLICATE, STATUS_TYPE_CODES.FAILED, STATUS_TYPE_CODES.PENDING,
])

function developersForSubmodule(projectId: string, submoduleId: string) {
  const sub = mockSubmodules.find((s) => s.id === submoduleId && s.projectId === projectId)
  return (sub?.developerEmployeeIds ?? []).map((id) => mockEmployeeRecords.find((e) => e.id === id)).filter(Boolean)
}

function hydrate(projectId: string, payload: DefectPayload, current?: DefectRecord, enteredBy = { id: 'emp-0001', name: 'Ada Fernando' }): ApiResponse<DefectRecord> {
  const module = mockModules.find((m) => m.id === payload.moduleId && m.projectId === projectId)
  const sub = mockSubmodules.find((s) => s.id === payload.submoduleId && s.moduleId === payload.moduleId)
  const type = mockDefectTypes.find((d) => d.id === payload.defectTypeId)
  const severity = mockSeverities.find((s) => s.id === payload.severityId)
  const priority = mockPriorities.find((p) => p.id === payload.priorityId)
  const release = mockReleases.find((r) => r.id === payload.releaseId && r.projectId === projectId)
  const developer = developersForSubmodule(projectId, payload.submoduleId).find((e) => e?.id === payload.assignedToId)
  if (!module) return fail('Module is required.')
  if (!sub) return fail('Select a valid Submodule for the selected Module.')
  if (!type) return fail('Defect Type is required.')
  if (!severity) return fail('Severity is required.')
  if (!priority) return fail('Priority is required.')
  if (!release) return fail('Found in Release is required.')
  if (!tidy(payload.description)) return fail('Brief Description is required.')
  if (!payload.recreationSteps.trim()) return fail('Recreation Steps are required.')
  if (!developer) return fail('Assigned To must be a developer assigned to the selected Submodule.')
  const now = new Date().toISOString()
  const defaultStatus = mockStatusTypes.find((s) => s.code === STATUS_TYPE_CODES.NEW) ?? mockStatusTypes[0]
  let linkedTestCaseId = current?.linkedTestCaseId
  let linkedTestCaseNo = current?.linkedTestCaseNo
  if (payload.testCaseRequired) {
    const existing = linkedTestCaseId ? mockTestCases.find((t) => t.id === linkedTestCaseId) : undefined
    const testCase = {
      id: existing?.id ?? `test-case-${crypto.randomUUID()}`,
      testCaseNo: existing?.testCaseNo ?? allocateProjectSequence(projectId, 'TESTCASE', mockTestCases.filter((item) => item.projectId === projectId).map((item) => item.testCaseNo)),
      projectId, moduleId: module.id, moduleName: module.name, submoduleId: sub.id, submoduleName: sub.name,
      defectTypeId: type.id, defectTypeName: type.name, severityId: severity.id, severityName: severity.name, severityColor: severity.color,
      description: tidy(payload.description), steps: payload.recreationSteps.trim(), createdAt: existing?.createdAt ?? now, updatedAt: now,
      allocatedReleaseCount: existing?.allocatedReleaseCount ?? 0, hasExecutionHistory: existing?.hasExecutionHistory ?? false,
    }
    if (existing) Object.assign(existing, testCase); else mockTestCases.unshift(testCase)
    linkedTestCaseId = testCase.id; linkedTestCaseNo = testCase.testCaseNo
  }
  const defectNumber = current ? { id: current.id, defectNo: current.defectNo } : allocateDefectNumber(projectId)
  return ok({
    id: defectNumber.id,
    defectNo: defectNumber.defectNo,
    projectId, moduleId: module.id, moduleName: module.name, submoduleId: sub.id, submoduleName: sub.name,
    defectTypeId: type.id, defectTypeName: type.name, severityId: severity.id, severityName: severity.name, severityColor: severity.color,
    priorityId: priority.id, priorityName: priority.name, priorityColor: priority.color,
    releaseId: release.id, releaseName: release.name, description: tidy(payload.description), recreationSteps: payload.recreationSteps.trim(),
    attachmentName: payload.attachmentName, statusCode: current?.statusCode ?? defaultStatus.code, statusName: current?.statusName ?? defaultStatus.name,
    assignedToId: developer.id, assignedToName: `${developer.firstName} ${developer.lastName}`,
    enteredById: current?.enteredById ?? enteredBy.id, enteredByName: current?.enteredByName ?? enteredBy.name,
    testCaseRequired: payload.testCaseRequired, linkedTestCaseId, linkedTestCaseNo,
    createdAt: current?.createdAt ?? now, updatedAt: now,
  })
}

function history(defectId: string, action: DefectHistoryRecord['action'], changedBy: string, fromValue?: string, toValue?: string) {
  mockDefectHistory.unshift({ id: `history-${Date.now()}-${Math.random()}`, defectId, action, changedBy, fromValue, toValue, changedAt: new Date().toISOString() })
}

export const defectService = {
  async getDefects(projectId: string, request: PageRequest): Promise<ApiResponse<Page<DefectRecord>>> { const filters = request.filters ?? {}; const response = await getConfigurationPage<BackendDefect>(defectEndpoint(projectId), { ...request, filters: { ...filters, subModuleId: filters.subModuleId ?? filters.submoduleId, submoduleId: undefined } }); if (!response.success) return fail(response.message); return ok({ ...response.data, content: response.data.content.map((item) => mapDefect(projectId, item)) }, response.message) },
  async getDefectById(projectId: string, id: string): Promise<ApiResponse<DefectRecord>> { const response = await apiRequest<BackendDefect>(`${defectEndpoint(projectId)}/${encodeURIComponent(id)}`); return response.success ? ok(mapDefect(projectId, response.data), response.message) : fail(response.message) },
  async createDefect(projectId: string, payload: DefectPayload, enteredBy?: { id: string; name: string }): Promise<ApiResponse<DefectRecord>> { void enteredBy; const response = await apiRequest<BackendDefect>(defectEndpoint(projectId), { method: 'POST', body: backendDefectPayload(payload) }); return response.success ? ok(mapDefect(projectId, response.data), response.message) : fail(response.message) },
  async updateDefect(projectId: string, id: string, payload: DefectPayload, changedBy = 'Super User'): Promise<ApiResponse<DefectRecord>> { void changedBy; const response = await apiRequest<BackendDefect>(`${defectEndpoint(projectId)}/${encodeURIComponent(id)}`, { method: 'PUT', body: backendDefectPayload(payload) }); return response.success ? ok(mapDefect(projectId, response.data), response.message) : fail(response.message) },
  async deleteDefect(projectId: string, id: string) { await mockDelay(); const i = mockDefects.findIndex((d) => d.projectId === projectId && d.id === id); if (i < 0) return fail<null>('Defect not found.'); if (mockDefects[i].statusCode === STATUS_TYPE_CODES.CLOSED) return fail<null>('Closed defects cannot be deleted.'); mockDefects.splice(i,1); return ok(null,'Defect deleted successfully.') },
  async updateDefectStatus(projectId: string, id: string, toStatusCode: string, changedBy = 'Super User'): Promise<ApiResponse<DefectRecord>> { void changedBy; const response = await apiRequest<BackendDefect>(`${defectEndpoint(projectId)}/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { toStatusCode } }); return response.success ? ok(mapDefect(projectId, response.data), response.message) : fail(response.message) },
  async reassignDefect(projectId: string, id: string, employeeId: string, changedBy = 'Super User'): Promise<ApiResponse<DefectRecord>> { void changedBy; const response = await apiRequest<BackendDefect>(`${defectEndpoint(projectId)}/${encodeURIComponent(id)}/reassign`, { method: 'PATCH', body: { newAssigneeId: Number(employeeId) } }); return response.success ? ok(mapDefect(projectId, response.data), response.message) : fail(response.message) },
  async getNextStatuses(id: string, projectId?: string): Promise<ApiResponse<StatusTypeRecord[]>> { if (!projectId) return fail('Project is required to load status transitions.'); const [defect, statuses, workflow] = await Promise.all([this.getDefectById(projectId, id), statusTypeService.getStatusTypes({ pageNumber: 0, pageSize: 100 }), defectWorkflowService.getWorkflow()]); if (!defect.success) return fail(defect.message); if (!statuses.success) return fail(statuses.message); if (!workflow.success) return fail(workflow.message); const current = statuses.data.content.find((status) => status.code === defect.data.statusCode); const ids = workflow.data.transitions.filter((transition) => transition.fromStatusId === current?.id).map((transition) => transition.toStatusId); return ok(statuses.data.content.filter((status) => ids.includes(status.id))) },
  async getHistory(id: string) { await mockDelay(160); return ok(mockDefectHistory.filter((h) => h.defectId === id)) },
  async getSubmoduleDevelopers(projectId: string, submoduleId: string): Promise<ApiResponse<{ id: string; name: string }[]>> { void submoduleId; const response = await employeeService.getProjectDevelopers(projectId); return response.success ? ok(response.data.map((employee) => ({ id: String(employee.id), name: employee.fullName })), response.message) : fail(response.message) },
  async exportRows(projectId: string, request: PageRequest) { await mockDelay(200); return ok(paginate(mockDefects.filter((d) => d.projectId === projectId), {...request,pageNumber:0,pageSize:100000}, ['defectNo','description']).content) },
  async validateImport(projectId: string, rows: Record<string, unknown>[]): Promise<ApiResponse<DefectImportValidation>> { await mockDelay(250); const mapped: DefectImportRow[] = rows.map((raw,index) => { const get=(...keys:string[])=>String(keys.map(k=>raw[k]).find(v=>v!==undefined)??'').trim(); const moduleName=get('Module','module'); const submoduleName=get('Submodule','submodule'); const defectTypeName=get('Defect Type','defectType'); const severityName=get('Severity','severity'); const priorityName=get('Priority','priority'); const releaseName=get('Found in Release','Release','release'); const description=get('Brief Description','Description','description'); const recreationSteps=get('Recreation Steps','Steps','steps'); const assignedToName=get('Assigned To','assignedTo'); const tc=['yes','true','1'].includes(get('Test Case Required','testCaseRequired').toLowerCase()); const errors:string[]=[]; const module=mockModules.find(m=>m.projectId===projectId&&m.name.toLowerCase()===moduleName.toLowerCase()); const sub=mockSubmodules.find(s=>s.moduleId===module?.id&&s.name.toLowerCase()===submoduleName.toLowerCase()); const dev=developersForSubmodule(projectId,sub?.id??'').find(e=>`${e!.firstName} ${e!.lastName}`.toLowerCase()===assignedToName.toLowerCase()); if(!module)errors.push('Unknown Module'); if(!sub)errors.push('Unknown Submodule'); if(!mockDefectTypes.some(x=>x.name.toLowerCase()===defectTypeName.toLowerCase()))errors.push('Unknown Defect Type'); if(!mockSeverities.some(x=>x.name.toLowerCase()===severityName.toLowerCase()))errors.push('Unknown Severity'); if(!mockPriorities.some(x=>x.name.toLowerCase()===priorityName.toLowerCase()))errors.push('Unknown Priority'); if(!mockReleases.some(x=>x.projectId===projectId&&x.name.toLowerCase()===releaseName.toLowerCase()))errors.push('Unknown Release'); if(!description)errors.push('Description is required'); if(!recreationSteps)errors.push('Recreation Steps are required'); if(!dev)errors.push('Assigned developer is not assigned to Submodule'); return {rowNumber:index+2,moduleName,submoduleName,defectTypeName,severityName,priorityName,releaseName,description,recreationSteps,assignedToName,testCaseRequired:tc,valid:errors.length===0,errors} }); return ok({rows:mapped,validCount:mapped.filter(r=>r.valid).length,invalidCount:mapped.filter(r=>!r.valid).length}) },
  async importRows(projectId: string, rows: DefectImportRow[], enteredBy={id:'emp-0001',name:'Ada Fernando'}) { await mockDelay(400); let imported=0; for(const row of rows.filter(r=>r.valid)){ const module=mockModules.find(m=>m.projectId===projectId&&m.name.toLowerCase()===row.moduleName.toLowerCase())!; const sub=mockSubmodules.find(s=>s.moduleId===module.id&&s.name.toLowerCase()===row.submoduleName.toLowerCase())!; const dev=developersForSubmodule(projectId,sub.id).find(e=>`${e!.firstName} ${e!.lastName}`.toLowerCase()===row.assignedToName.toLowerCase())!; const r=hydrate(projectId,{moduleId:module.id,submoduleId:sub.id,defectTypeId:mockDefectTypes.find(x=>x.name.toLowerCase()===row.defectTypeName.toLowerCase())!.id,severityId:mockSeverities.find(x=>x.name.toLowerCase()===row.severityName.toLowerCase())!.id,priorityId:mockPriorities.find(x=>x.name.toLowerCase()===row.priorityName.toLowerCase())!.id,releaseId:mockReleases.find(x=>x.projectId===projectId&&x.name.toLowerCase()===row.releaseName.toLowerCase())!.id,description:row.description,recreationSteps:row.recreationSteps,assignedToId:dev.id,testCaseRequired:row.testCaseRequired},undefined,enteredBy); if(r.success){mockDefects.unshift(r.data); history(r.data.id,'IMPORTED',enteredBy.name); imported++}} return ok({imported,skipped:rows.length-imported},`${imported} defects imported successfully.`) },
  getDefectTypes(request: PageRequest): Promise<ApiResponse<Page<DefectTypeConfig>>> { return defectTypeService.getDefectTypes(request) },
  getSeverities(request: PageRequest): Promise<ApiResponse<Page<SeverityConfig>>> { return severityService.getSeverities(request) },
  getPriorities(request: PageRequest): Promise<ApiResponse<Page<PriorityConfig>>> { return priorityService.getPriorities(request) },
}
