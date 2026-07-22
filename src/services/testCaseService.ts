import { ApiResponse, Page, PageRequest } from '@/types/common'
import { TestCaseImportRow, TestCaseImportValidation, TestCasePayload, TestCaseRecord } from '@/types/testCase'
import { mockTestCases } from '@/mock/testCases'
import { mockModules, mockSubmodules } from '@/mock/moduleManagement'
import { mockDefectTypes, mockSeverities } from '@/mock/configuration'
import { apiRequest, fail, mockDelay, ok, paginate } from './apiClient'
import { getConfigurationPage } from './configurationApi'
import { allocateProjectSequence } from './projectSequenceService'

const tidy = (value: string) => value.trim().replace(/\s+/g, ' ')
const SORTABLE_FIELDS = new Set(['testCaseNo', 'description', 'createdAt', 'updatedAt', 'executionStatus'])

const endpoint = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/testcases`

type BackendTestCase = Partial<TestCaseRecord> & {
  subModuleId?: string | number
  subModuleName?: string
}

const mapTestCase = (projectId: string, item: BackendTestCase): TestCaseRecord => ({
  id: String(item.id ?? ''),
  testCaseNo: String(item.testCaseNo ?? ''),
  projectId: String(item.projectId ?? projectId),
  moduleId: String(item.moduleId ?? ''),
  moduleName: String(item.moduleName ?? ''),
  submoduleId: String(item.submoduleId ?? item.subModuleId ?? ''),
  submoduleName: String(item.submoduleName ?? item.subModuleName ?? ''),
  defectTypeId: String(item.defectTypeId ?? ''),
  defectTypeName: String(item.defectTypeName ?? ''),
  severityId: String(item.severityId ?? ''),
  severityName: String(item.severityName ?? ''),
  severityColor: String(item.severityColor ?? '#64748B'),
  description: String(item.description ?? ''),
  steps: String(item.steps ?? ''),
  createdAt: String(item.createdAt ?? ''),
  updatedAt: String(item.updatedAt ?? ''),
  allocatedReleaseCount: Number(item.allocatedReleaseCount ?? 0),
  hasExecutionHistory: Boolean(item.hasExecutionHistory),
})

function hydrate(projectId: string, payload: TestCasePayload, current?: TestCaseRecord): ApiResponse<TestCaseRecord> {
  const module = mockModules.find((item) => item.id === payload.moduleId && item.projectId === projectId)
  const submodule = mockSubmodules.find((item) => item.id === payload.submoduleId && item.moduleId === payload.moduleId)
  const defectType = mockDefectTypes.find((item) => item.id === payload.defectTypeId)
  const severity = mockSeverities.find((item) => item.id === payload.severityId)
  const description = tidy(payload.description)
  const steps = payload.steps.trim()
  if (!module) return fail('Module is required.')
  if (!submodule) return fail('Select a valid Submodule for the selected Module.')
  if (!defectType) return fail('Defect Type is required.')
  if (!severity) return fail('Severity is required.')
  if (!description) return fail('Description is required.')
  if (!steps) return fail('Steps are required.')
  const now = new Date().toISOString()
  return ok({
    id: current?.id ?? `test-case-${crypto.randomUUID()}`,
    testCaseNo: current?.testCaseNo ?? allocateProjectSequence(projectId, 'TESTCASE', mockTestCases.filter((item) => item.projectId === projectId).map((item) => item.testCaseNo)),
    projectId,
    moduleId: module.id,
    moduleName: module.name,
    submoduleId: submodule.id,
    submoduleName: submodule.name,
    defectTypeId: defectType.id,
    defectTypeName: defectType.name,
    severityId: severity.id,
    severityName: severity.name,
    severityColor: severity.color,
    description,
    steps,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
    allocatedReleaseCount: current?.allocatedReleaseCount ?? 0,
    hasExecutionHistory: current?.hasExecutionHistory ?? false,
  })
}

function escapeCsv(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export const testCaseService = {
  async getTestCases(projectId: string, request: PageRequest): Promise<ApiResponse<Page<TestCaseRecord>>> {
    const filters = request.filters ?? {}
    const sortBy = request.sortBy && SORTABLE_FIELDS.has(request.sortBy)
      ? request.sortBy
      : 'createdAt'
    const response = await getConfigurationPage<BackendTestCase>(endpoint(projectId), {
      ...request,
      sortBy,
      sortDir: request.sortDir ?? 'desc',
      filters: {
        moduleId: filters.moduleId,
        subModuleId: filters.subModuleId ?? filters.submoduleId,
        defectTypeId: filters.defectTypeId,
        severityId: filters.severityId,
        executionStatus: filters.executionStatus,
        assignedToId: filters.assignedToId,
        releaseId: filters.releaseId,
      },
    })
    if (!response.success) return fail(response.message)
    return ok({
      ...response.data,
      content: response.data.content.map((item) => mapTestCase(projectId, item)),
    }, response.message)
  },
  async getTestCaseById(projectId: string, id: string): Promise<ApiResponse<TestCaseRecord>> {
    const response = await apiRequest<BackendTestCase>(`${endpoint(projectId)}/${encodeURIComponent(id)}`)
    return response.success
      ? ok(mapTestCase(projectId, response.data), response.message)
      : fail(response.message)
  },
  async createTestCase(projectId: string, payload: TestCasePayload): Promise<ApiResponse<TestCaseRecord>> {
    const response = await apiRequest<BackendTestCase>(endpoint(projectId), {
      method: 'POST',
      body: {
        moduleId: payload.moduleId,
        subModuleId: payload.submoduleId,
        defectTypeId: payload.defectTypeId,
        severityId: payload.severityId,
        description: tidy(payload.description),
        steps: payload.steps.trim(),
      },
    })
    return response.success
      ? ok(mapTestCase(projectId, response.data), response.message)
      : fail(response.message)
  },
  async updateTestCase(projectId: string, id: string, payload: TestCasePayload): Promise<ApiResponse<TestCaseRecord>> {
    await mockDelay()
    const index = mockTestCases.findIndex((row) => row.projectId === projectId && row.id === id)
    if (index < 0) return fail('Test case not found.')
    const response = hydrate(projectId, payload, mockTestCases[index])
    if (!response.success) return response
    mockTestCases[index] = response.data
    return ok(response.data, `${response.data.testCaseNo} updated successfully.`)
  },
  async deleteTestCase(projectId: string, id: string): Promise<ApiResponse<null>> {
    await mockDelay()
    const index = mockTestCases.findIndex((row) => row.projectId === projectId && row.id === id)
    if (index < 0) return fail('Test case not found.')
    const item = mockTestCases[index]
    if (item.allocatedReleaseCount > 0 || item.hasExecutionHistory) return fail('This test case is already used in a release and cannot be deleted.')
    mockTestCases.splice(index, 1)
    return ok(null, 'Test case deleted successfully.')
  },
  async getModuleTestCaseCounts(projectId: string): Promise<ApiResponse<Record<string, number>>> {
    const response = await this.getTestCases(projectId, { pageNumber: 0, pageSize: 100000 })
    if (!response.success) return fail(response.message)
    const counts: Record<string, number> = {}
    response.data.content.forEach((item) => { counts[item.moduleId] = (counts[item.moduleId] ?? 0) + 1 })
    return ok(counts, response.message)
  },
  async getSubmoduleTestCaseCounts(projectId: string, moduleId: string): Promise<ApiResponse<Record<string, number>>> {
    const response = await this.getTestCases(projectId, {
      pageNumber: 0,
      pageSize: 100000,
      filters: { moduleId },
    })
    if (!response.success) return fail(response.message)
    const counts: Record<string, number> = {}
    response.data.content.forEach((item) => { counts[item.submoduleId] = (counts[item.submoduleId] ?? 0) + 1 })
    return ok(counts, response.message)
  },
  async exportTestCases(projectId: string, request: PageRequest): Promise<ApiResponse<string>> {
    await mockDelay(220)
    const page = paginate(mockTestCases.filter((item) => item.projectId === projectId), { ...request, pageNumber: 0, pageSize: 100000 }, ['testCaseNo', 'description'])
    const header = ['Test Case Number', 'Module', 'Submodule', 'Defect Type', 'Severity', 'Description', 'Steps']
    const rows = page.content.map((item) => [item.testCaseNo, item.moduleName, item.submoduleName, item.defectTypeName, item.severityName, item.description, item.steps])
    return ok([header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n'))
  },
  async downloadTestCaseImportTemplate(): Promise<ApiResponse<string>> {
    await mockDelay(120)
    return ok([
      ['Module', 'Submodule', 'Defect Type', 'Severity', 'Description', 'Steps'],
      ['Settlement Engine', 'Settlement Posting', 'Functional', 'High', 'Verify valid settlement posting', '1. Open page 2. Submit data 3. Verify result'],
    ].map((row) => row.map(escapeCsv).join(',')).join('\n'))
  },
  async validateTestCaseImport(projectId: string, csvText: string): Promise<ApiResponse<TestCaseImportValidation>> {
    await mockDelay(350)
    const lines = csvText.split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) return fail('The import file does not contain data rows.')
    const parse = (line: string) => line.match(/("(?:[^"]|"")*"|[^,]*)/g)?.filter((v) => v !== '').map((v) => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) ?? []
    const headers = parse(lines[0]).map((value) => value.toLowerCase())
    const required = ['module', 'submodule', 'defect type', 'severity', 'description', 'steps']
    if (required.some((name) => !headers.includes(name))) return fail(`Missing required headers. Required: ${required.join(', ')}.`)
    const rows: TestCaseImportRow[] = lines.slice(1).map((line, index) => {
      const values = parse(line)
      const get = (name: string) => values[headers.indexOf(name)] ?? ''
      const moduleName = get('module'); const submoduleName = get('submodule'); const defectTypeName = get('defect type'); const severityName = get('severity'); const description = get('description'); const steps = get('steps')
      const errors: string[] = []
      const module = mockModules.find((item) => item.projectId === projectId && item.name.toLowerCase() === moduleName.toLowerCase())
      const submodule = mockSubmodules.find((item) => item.moduleId === module?.id && item.name.toLowerCase() === submoduleName.toLowerCase())
      if (!module) errors.push('Unknown Module')
      if (!submodule) errors.push('Unknown Submodule or Submodule does not belong to Module')
      if (!mockDefectTypes.some((item) => item.name.toLowerCase() === defectTypeName.toLowerCase())) errors.push('Unknown Defect Type')
      if (!mockSeverities.some((item) => item.name.toLowerCase() === severityName.toLowerCase())) errors.push('Unknown Severity')
      if (!description.trim()) errors.push('Description is required')
      if (!steps.trim()) errors.push('Steps are required')
      return { rowNumber: index + 2, moduleName, submoduleName, defectTypeName, severityName, description, steps, valid: errors.length === 0, errors }
    })
    return ok({ rows, validCount: rows.filter((row) => row.valid).length, invalidCount: rows.filter((row) => !row.valid).length })
  },
  async importTestCases(projectId: string, rows: TestCaseImportRow[]): Promise<ApiResponse<{ imported: number; skipped: number }>> {
    await mockDelay(500)
    let imported = 0
    rows.filter((row) => row.valid).forEach((row) => {
      const module = mockModules.find((item) => item.projectId === projectId && item.name.toLowerCase() === row.moduleName.toLowerCase())!
      const submodule = mockSubmodules.find((item) => item.moduleId === module.id && item.name.toLowerCase() === row.submoduleName.toLowerCase())!
      const defectType = mockDefectTypes.find((item) => item.name.toLowerCase() === row.defectTypeName.toLowerCase())!
      const severity = mockSeverities.find((item) => item.name.toLowerCase() === row.severityName.toLowerCase())!
      const result = hydrate(projectId, { moduleId: module.id, submoduleId: submodule.id, defectTypeId: defectType.id, severityId: severity.id, description: row.description, steps: row.steps })
      if (result.success) { mockTestCases.unshift(result.data); imported += 1 }
    })
    return ok({ imported, skipped: rows.length - imported }, `${imported} test cases imported successfully.`)
  },
}
