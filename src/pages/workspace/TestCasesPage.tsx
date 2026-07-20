import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Edit3, Eye, FileDown, FileUp, Plus, RotateCcw, Search as SearchIcon, Trash2, Upload } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Button, Card, Dropdown, Input, Modal, Pagination, Table, TableColumn } from '@/components/common'
import { ProjectSelector } from '@/components/projects/ProjectSelector'
import { ProjectModuleGate } from '@/components/projects/ProjectSelectionGate'
import { useProjectScope } from '@/hooks/useProjectScope'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { PRIV } from '@/constants/privileges'
import { testCaseService } from '@/services/testCaseService'
import { moduleManagementService } from '@/services/moduleManagementService'
import { defectTypeService } from '@/services/defectTypeService'
import { severityService } from '@/services/severityService'
import { Page, PageSizeOption } from '@/types/common'
import { ModuleRecord, SubmoduleRecord } from '@/types/moduleManagement'
import { DefectTypeConfig, SeverityConfig } from '@/types/defect'
import { TestCaseImportValidation, TestCasePayload, TestCaseRecord } from '@/types/testCase'
import { formatDate } from '@/utils/format'
import { MODULE_REFERENCE_DATA_CHANGED } from '@/utils/referenceDataEvents'

const EMPTY_FORM: TestCasePayload = { moduleId: '', submoduleId: '', defectTypeId: '', severityId: '', description: '', steps: '' }

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

interface TestCasesPageProps {
  title?: string
  description?: string
  showCreateAction?: boolean
}

export const TestCasesPage: React.FC<TestCasesPageProps> = ({
  title = 'Test Cases',
  description = 'Create, organize, import, export, and maintain project test cases.',
  showCreateAction = true,
}) => {
  const { projectId, isProjectRoute } = useProjectScope()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasPrivilege } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const fileRef = useRef<HTMLInputElement>(null)

  const [modules, setModules] = useState<ModuleRecord[]>([])
  const [submodules, setSubmodules] = useState<SubmoduleRecord[]>([])
  const [defectTypes, setDefectTypes] = useState<DefectTypeConfig[]>([])
  const [severities, setSeverities] = useState<SeverityConfig[]>([])
  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({})
  const [submoduleCounts, setSubmoduleCounts] = useState<Record<string, number>>({})

  const [page, setPage] = useState<Page<TestCaseRecord> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(0)
  const [pageSize, setPageSize] = useState<PageSizeOption>(10)
  const [search, setSearch] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [submoduleId, setSubmoduleId] = useState('')
  const [severityId, setSeverityId] = useState('')
  const [defectTypeId, setDefectTypeId] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [viewing, setViewing] = useState<TestCaseRecord | null>(null)
  const [editing, setEditing] = useState<TestCaseRecord | null>(null)
  const [form, setForm] = useState<TestCasePayload>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importValidation, setImportValidation] = useState<TestCaseImportValidation | null>(null)
  const [importing, setImporting] = useState(false)

  const selectedModuleSubmodules = useMemo(() => submodules.filter((item) => item.moduleId === form.moduleId), [submodules, form.moduleId])
  const filterSubmodules = useMemo(() => submodules.filter((item) => item.moduleId === moduleId), [submodules, moduleId])

  const loadReferenceData = useCallback(async () => {
    if (!projectId) return
    const [modulesRes, defectTypesRes, severitiesRes, countsRes] = await Promise.all([
      moduleManagementService.getModules(projectId),
      defectTypeService.getDefectTypes({ pageNumber: 0, pageSize: 100 }),
      severityService.getSeverities({ pageNumber: 0, pageSize: 100 }),
      testCaseService.getModuleTestCaseCounts(projectId),
    ])
    if (modulesRes.success) {
      setModules(modulesRes.data)
      const allSubmodules = await Promise.all(modulesRes.data.map((module) => moduleManagementService.getSubmodules(projectId, module.id)))
      setSubmodules(allSubmodules.flatMap((response) => response.success ? response.data : []))
    }
    if (defectTypesRes.success) setDefectTypes(defectTypesRes.data.content)
    if (severitiesRes.success) setSeverities(severitiesRes.data.content)
    if (countsRes.success) setModuleCounts(countsRes.data)
  }, [projectId])

  const loadRows = useCallback(async () => {
    if (!projectId) return
    setLoading(true); setError(null)
    const response = await testCaseService.getTestCases(projectId, {
      pageNumber,
      pageSize,
      search: search.trim(),
      sortBy: 'testCaseNo',
      sortDir: 'asc',
      filters: { moduleId, submoduleId, severityId, defectTypeId },
    })
    if (response.success) setPage(response.data)
    else setError(response.message)
    setLoading(false)
  }, [projectId, pageNumber, pageSize, search, moduleId, submoduleId, severityId, defectTypeId])

  useEffect(() => {
    setModuleId(''); setSubmoduleId(''); setSeverityId(''); setDefectTypeId(''); setSearch(''); setPageNumber(0)
    setEditing(null); setForm(EMPTY_FORM); setFormErrors({}); setFormOpen(false)
    void loadReferenceData()
  }, [projectId, loadReferenceData])

  useEffect(() => { void loadRows() }, [loadRows])

  useEffect(() => {
    if (!projectId || !moduleId) { setSubmoduleCounts({}); return }
    void testCaseService.getSubmoduleTestCaseCounts(projectId, moduleId).then((response) => response.success && setSubmoduleCounts(response.data))
  }, [projectId, moduleId, page])

  const resetFilters = () => {
    setModuleId(''); setSubmoduleId(''); setSeverityId(''); setDefectTypeId(''); setSearch(''); setPageNumber(0)
  }

  const openCreate = () => {
    const selectedModuleId = modules.some((item) => item.id === moduleId) ? moduleId : ''
    const selectedSubmoduleId = submodules.some((item) => item.projectId === projectId && item.moduleId === selectedModuleId && item.id === submoduleId) ? submoduleId : ''
    setEditing(null)
    setForm({ ...EMPTY_FORM, moduleId: selectedModuleId, submoduleId: selectedSubmoduleId })
    setFormErrors({})
    setFormOpen(true)
  }

  const updateCreateModule = (selectedModuleId: string) => {
    setForm((previous) => ({ ...previous, moduleId: selectedModuleId, submoduleId: '' }))
    setModuleId((current) => current === selectedModuleId ? current : selectedModuleId)
    setSubmoduleId((current) => current === '' ? current : '')
    setPageNumber(0)
    setFormErrors((previous) => ({ ...previous, moduleId: '', submoduleId: '' }))
  }

  const updateCreateSubmodule = (selectedSubmoduleId: string) => {
    const validSubmoduleId = submodules.some((item) => item.projectId === projectId && item.moduleId === form.moduleId && item.id === selectedSubmoduleId) ? selectedSubmoduleId : ''
    setForm((previous) => previous.submoduleId === validSubmoduleId ? previous : { ...previous, submoduleId: validSubmoduleId })
    setSubmoduleId((current) => current === validSubmoduleId ? current : validSubmoduleId)
    setPageNumber(0)
    setFormErrors((previous) => ({ ...previous, submoduleId: '' }))
  }

  useEffect(() => {
    if (!formOpen || editing) return
    const validModuleId = modules.some((item) => item.id === moduleId) ? moduleId : ''
    const validSubmoduleId = submodules.some((item) => item.projectId === projectId && item.moduleId === validModuleId && item.id === submoduleId) ? submoduleId : ''
    setForm((previous) => previous.moduleId === validModuleId && previous.submoduleId === validSubmoduleId
      ? previous
      : { ...previous, moduleId: validModuleId, submoduleId: validSubmoduleId })
  }, [editing, formOpen, moduleId, modules, projectId, submoduleId, submodules])
  useEffect(() => {
    if (!projectId || searchParams.get('create') !== 'testcase') return
    openCreate()
    const next = new URLSearchParams(searchParams); next.delete('create')
    setSearchParams(next, { replace: true })
  }, [projectId, searchParams, setSearchParams])

  useEffect(() => {
    const refresh = () => { void loadReferenceData() }
    window.addEventListener(MODULE_REFERENCE_DATA_CHANGED, refresh)
    return () => window.removeEventListener(MODULE_REFERENCE_DATA_CHANGED, refresh)
  }, [loadReferenceData])
  const openEdit = (item: TestCaseRecord) => {
    setEditing(item)
    setForm({ moduleId: item.moduleId, submoduleId: item.submoduleId, defectTypeId: item.defectTypeId, severityId: item.severityId, description: item.description, steps: item.steps })
    setFormErrors({}); setFormOpen(true)
  }
  const validate = () => {
    const errors: Record<string, string> = {}
    const validModule = modules.some((item) => item.id === form.moduleId)
    const validSubmodule = submodules.some((item) => item.projectId === projectId && item.moduleId === form.moduleId && item.id === form.submoduleId)
    if (!validModule) errors.moduleId = 'Select a valid Module for the selected Project.'
    if (!validSubmodule) errors.submoduleId = 'Select a valid Submodule for the selected Module.'
    if (!form.defectTypeId) errors.defectTypeId = 'Defect Type is required.'
    if (!form.severityId) errors.severityId = 'Severity is required.'
    if (!form.description.trim()) errors.description = 'Description is required.'
    if (!form.steps.trim()) errors.steps = 'Steps are required.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  const changed = editing ? JSON.stringify(form) !== JSON.stringify({ moduleId: editing.moduleId, submoduleId: editing.submoduleId, defectTypeId: editing.defectTypeId, severityId: editing.severityId, description: editing.description, steps: editing.steps }) : true

  const save = async () => {
    if (!projectId || !validate()) return
    setSaving(true)
    const response = editing ? await testCaseService.updateTestCase(projectId, editing.id, form) : await testCaseService.createTestCase(projectId, form)
    setSaving(false)
    if (!response.success) { toast.error(response.message); return }
    toast.success(response.message); setFormOpen(false); await loadReferenceData(); await loadRows()
  }

  const remove = async (item: TestCaseRecord) => {
    if (!projectId) return
    const accepted = await confirm({ title: 'Delete Test Case', message: `Delete ${item.testCaseNo}? This action cannot be undone.`, confirmText: 'Delete', variant: 'danger' })
    if (!accepted) return
    const response = await testCaseService.deleteTestCase(projectId, item.id)
    response.success ? toast.success(response.message) : toast.error(response.message)
    if (response.success) { await loadReferenceData(); await loadRows() }
  }

  const exportRows = async (all = false) => {
    if (!projectId) return
    const response = await testCaseService.exportTestCases(projectId, {
      pageNumber: 0, pageSize: 100000, search: all ? '' : search.trim(),
      filters: all ? {} : { moduleId, submoduleId, severityId, defectTypeId },
    })
    if (response.success) { downloadText(`test-cases-${projectId}.csv`, response.data); toast.success('Test cases exported successfully.') }
  }
  const downloadTemplate = async () => {
    const response = await testCaseService.downloadTestCaseImportTemplate()
    if (response.success) downloadText('test-case-import-template.csv', response.data)
  }
  const readImportFile = async (file?: File) => {
    if (!file || !projectId) return
    if (!file.name.toLowerCase().endsWith('.csv')) { toast.error('Upload a CSV file exported from the template.'); return }
    const validation = await testCaseService.validateTestCaseImport(projectId, await file.text())
    if (!validation.success) { toast.error(validation.message); return }
    setImportValidation(validation.data); setImportOpen(true)
  }
  const runImport = async () => {
    if (!projectId || !importValidation) return
    setImporting(true)
    const response = await testCaseService.importTestCases(projectId, importValidation.rows)
    setImporting(false)
    if (!response.success) { toast.error(response.message); return }
    toast.success(`${response.data.imported} test cases imported. ${response.data.skipped} rows skipped.`)
    setImportOpen(false); setImportValidation(null); await loadReferenceData(); await loadRows()
  }

  const columns: TableColumn<TestCaseRecord>[] = [
    { key: 'testCaseNo', header: 'Test Case No', render: (item) => <button onClick={() => setViewing(item)} className="font-mono text-xs font-semibold text-brand-600 hover:underline">{item.testCaseNo}</button>, width: '125px' },
    { key: 'description', header: 'Description', render: (item) => <div className="max-w-[360px]"><p className="font-medium text-ink-800 line-clamp-2">{item.description}</p><p className="mt-0.5 text-xs text-ink-400">{item.submoduleName}</p></div> },
    { key: 'moduleName', header: 'Module', render: (item) => item.moduleName },
    { key: 'defectTypeName', header: 'Defect Type', render: (item) => item.defectTypeName },
    { key: 'severityName', header: 'Severity', render: (item) => <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: `${item.severityColor}18`, color: item.severityColor, boxShadow: `inset 0 0 0 1px ${item.severityColor}40` }}>{item.severityName}</span> },
    { key: 'createdAt', header: 'Created', render: (item) => formatDate(item.createdAt) },
    { key: 'actions', header: 'Actions', align: 'right', render: (item) => <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
      <Button size="sm" variant="ghost" title="View" onClick={() => setViewing(item)}><Eye className="h-4 w-4" /></Button>
      {hasPrivilege(PRIV.TESTCASE_UPDATE) && <Button size="sm" variant="ghost" title="Edit" onClick={() => openEdit(item)}><Edit3 className="h-4 w-4" /></Button>}
      {hasPrivilege(PRIV.TESTCASE_DELETE) && <Button size="sm" variant="ghost" title="Delete" onClick={() => void remove(item)}><Trash2 className="h-4 w-4 text-signal-critical" /></Button>}
    </div> },
  ]

  const content = <>
    <div className="grid gap-4 xl:grid-cols-[270px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card title="Modules" subtitle="Select a module to narrow the test cases.">
          <div className="space-y-2">
            <button onClick={() => { setModuleId(''); setSubmoduleId(''); setPageNumber(0) }} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${!moduleId ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'hover:bg-ink-50'}`}><span>All Modules</span><Badge>{Object.values(moduleCounts).reduce((a, b) => a + b, 0)}</Badge></button>
            {modules.map((module) => <button key={module.id} onClick={() => { setModuleId(module.id); setSubmoduleId(''); setPageNumber(0) }} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${moduleId === module.id ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'hover:bg-ink-50'}`}><span className="truncate">{module.name}</span><Badge>{moduleCounts[module.id] ?? 0}</Badge></button>)}
          </div>
        </Card>
        {moduleId && <Card title="Submodules" subtitle="Counts update for the selected module.">
          <div className="space-y-2">
            <button onClick={() => { setSubmoduleId(''); setPageNumber(0) }} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${!submoduleId ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'hover:bg-ink-50'}`}><span>All Submodules</span><Badge>{Object.values(submoduleCounts).reduce((a, b) => a + b, 0)}</Badge></button>
            {filterSubmodules.map((submodule) => <button key={submodule.id} onClick={() => { setSubmoduleId(submodule.id); setPageNumber(0) }} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${submoduleId === submodule.id ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'hover:bg-ink-50'}`}><span className="truncate">{submodule.name}</span><Badge>{submoduleCounts[submodule.id] ?? 0}</Badge></button>)}
          </div>
        </Card>}
      </div>
      <div className="min-w-0 space-y-4">
        <Card>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPageNumber(0) }} placeholder="Search description..." leftIcon={<SearchIcon className="h-4 w-4" />} />
            <Dropdown value={moduleId} onChange={(event) => { setModuleId(event.target.value); setSubmoduleId(''); setPageNumber(0) }} options={modules.map((item) => ({ value: item.id, label: item.name }))} placeholder="All Modules" />
            <Dropdown value={submoduleId} disabled={!moduleId} onChange={(event) => { setSubmoduleId(event.target.value); setPageNumber(0) }} options={filterSubmodules.map((item) => ({ value: item.id, label: item.name }))} placeholder="All Submodules" />
            <Dropdown value={severityId} onChange={(event) => { setSeverityId(event.target.value); setPageNumber(0) }} options={severities.map((item) => ({ value: item.id, label: item.name }))} placeholder="All Severities" />
            <Dropdown value={defectTypeId} onChange={(event) => { setDefectTypeId(event.target.value); setPageNumber(0) }} options={defectTypes.map((item) => ({ value: item.id, label: item.name }))} placeholder="All Defect Types" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="filterClear" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={resetFilters}>Clear Filters</Button>
          </div>
        </Card>
        <Table columns={columns} rows={page?.content ?? []} rowKey={(item) => item.id} isLoading={loading} error={error} onRetry={() => void loadRows()} emptyTitle="No test cases found" />
        <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={(size) => { setPageSize(size); setPageNumber(0) }} />
      </div>
    </div>
  </>

  return <div>
    <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { void readImportFile(event.target.files?.[0]); event.currentTarget.value = '' }} />
    <PageHeader title={title} description={description} actions={<>
      {!isProjectRoute && <ProjectSelector />}
      {showCreateAction && hasPrivilege(PRIV.TESTCASE_CREATE) && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>Create Test Case</Button>}
      {hasPrivilege(PRIV.TESTCASE_EXPORT) && <Button variant="outline" leftIcon={<FileDown className="h-4 w-4" />} onClick={() => void exportRows(false)}>Export Filtered</Button>}
      {hasPrivilege(PRIV.TESTCASE_EXPORT) && <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={() => void downloadTemplate()}>Import Template</Button>}
      {hasPrivilege(PRIV.TESTCASE_IMPORT) && <Button variant="outline" leftIcon={<FileUp className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>Import</Button>}
    </>} />
    <ProjectModuleGate isProjectRoute={isProjectRoute}>{content}</ProjectModuleGate>

    <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Edit ${editing.testCaseNo}` : 'Create Test Case'} description="Test Case Number is generated automatically." size="lg" footer={<><Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={() => void save()} isLoading={saving} disabled={Boolean(editing) && !changed}>{editing ? 'Update' : 'Create'}</Button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <Dropdown label="Module" required value={form.moduleId} error={formErrors.moduleId} options={modules.map((item) => ({ value: item.id, label: item.name }))} onChange={(event) => editing ? (setForm({ ...form, moduleId: event.target.value, submoduleId: '' }), setFormErrors({ ...formErrors, moduleId: '', submoduleId: '' })) : updateCreateModule(event.target.value)} />
        <Dropdown label="Submodule" required disabled={!form.moduleId} value={form.submoduleId} error={formErrors.submoduleId} options={selectedModuleSubmodules.map((item) => ({ value: item.id, label: item.name }))} onChange={(event) => editing ? (setForm({ ...form, submoduleId: event.target.value }), setFormErrors({ ...formErrors, submoduleId: '' })) : updateCreateSubmodule(event.target.value)} />
        <Dropdown label="Defect Type" required value={form.defectTypeId} error={formErrors.defectTypeId} options={defectTypes.map((item) => ({ value: item.id, label: item.name }))} onChange={(event) => { setForm({ ...form, defectTypeId: event.target.value }); setFormErrors({ ...formErrors, defectTypeId: '' }) }} />
        <Dropdown label="Severity" required value={form.severityId} error={formErrors.severityId} options={severities.map((item) => ({ value: item.id, label: item.name }))} onChange={(event) => { setForm({ ...form, severityId: event.target.value }); setFormErrors({ ...formErrors, severityId: '' }) }} />
        <div className="md:col-span-2"><label className="mb-1.5 block text-sm font-medium text-ink-700">Description<span className="ml-0.5 text-signal-critical">*</span></label><textarea value={form.description} onChange={(event) => { setForm({ ...form, description: event.target.value }); setFormErrors({ ...formErrors, description: '' }) }} rows={3} className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 ${formErrors.description ? 'border-signal-critical' : 'border-ink-200'}`} />{formErrors.description && <p className="mt-1 text-xs text-signal-critical">{formErrors.description}</p>}</div>
        <div className="md:col-span-2"><label className="mb-1.5 block text-sm font-medium text-ink-700">Steps<span className="ml-0.5 text-signal-critical">*</span></label><textarea value={form.steps} onChange={(event) => { setForm({ ...form, steps: event.target.value }); setFormErrors({ ...formErrors, steps: '' }) }} rows={6} className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 ${formErrors.steps ? 'border-signal-critical' : 'border-ink-200'}`} />{formErrors.steps && <p className="mt-1 text-xs text-signal-critical">{formErrors.steps}</p>}</div>
      </div>
    </Modal>

    <Modal isOpen={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing?.testCaseNo ?? 'Test Case Details'} size="lg">
      {viewing && <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><Detail label="Module" value={viewing.moduleName} /><Detail label="Submodule" value={viewing.submoduleName} /><Detail label="Defect Type" value={viewing.defectTypeName} /><Detail label="Created" value={formatDate(viewing.createdAt)} /></div><div><p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Severity</p><span className="mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: `${viewing.severityColor}18`, color: viewing.severityColor }}>{viewing.severityName}</span></div><Detail label="Description" value={viewing.description} /><div><p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Steps</p><pre className="mt-2 whitespace-pre-wrap rounded-md bg-ink-50 p-4 text-sm text-ink-700">{viewing.steps}</pre></div></div>}
    </Modal>

    <Modal isOpen={importOpen} onClose={() => setImportOpen(false)} title="Import Test Cases" description="Review validation results before importing valid rows." size="lg" footer={<><Button variant="ghost" onClick={() => setImportOpen(false)}>Cancel</Button><Button leftIcon={<Upload className="h-4 w-4" />} onClick={() => void runImport()} isLoading={importing} disabled={!importValidation?.validCount}>Import {importValidation?.validCount ?? 0} Valid Rows</Button></>}>
      {importValidation && <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700"><strong>{importValidation.validCount}</strong> valid rows</div><div className="rounded-md bg-red-50 p-3 text-sm text-red-700"><strong>{importValidation.invalidCount}</strong> invalid rows</div></div><div className="max-h-80 overflow-auto rounded-md border border-ink-100"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-ink-50"><tr><th className="p-2">Row</th><th className="p-2">Module / Submodule</th><th className="p-2">Status</th><th className="p-2">Errors</th></tr></thead><tbody>{importValidation.rows.map((row) => <tr key={row.rowNumber} className="border-t border-ink-100"><td className="p-2">{row.rowNumber}</td><td className="p-2">{row.moduleName} / {row.submoduleName}</td><td className="p-2"><Badge tone={row.valid ? 'success' : 'critical'}>{row.valid ? 'Valid' : 'Invalid'}</Badge></td><td className="p-2 text-signal-critical">{row.errors.join('; ') || '—'}</td></tr>)}</tbody></table></div></div>}
    </Modal>
  </div>
}

const Detail: React.FC<{ label: string; value: string }> = ({ label, value }) => <div><p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p><p className="mt-1 text-sm text-ink-800">{value}</p></div>
