import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Layers3, ListChecks, Search, ShieldCheck, Users, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectSelector } from '@/components/projects/ProjectSelector'
import { ProjectModuleGate } from '@/components/projects/ProjectSelectionGate'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Dropdown } from '@/components/common/Dropdown'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { Loader } from '@/components/common/Loader'
import { Pagination } from '@/components/common/Pagination'
import { useProjectScope } from '@/hooks/useProjectScope'
import { useToast } from '@/context/ToastContext'
import { releaseService } from '@/services/releaseService'
import { moduleManagementService } from '@/services/moduleManagementService'
import { releaseTestCaseService } from '@/services/releaseTestCaseService'
import { ReleaseRecord } from '@/types/release'
import { TestCase } from '@/types/defect'
import { AllocationMode, ReleaseTestCaseRecord } from '@/types/releaseTestCase'
import { ModuleRecord, SubmoduleRecord, AssignedProjectMember } from '@/types/moduleManagement'

const MODES: { value: AllocationMode; label: string; help: string }[] = [
  { value: 'ONE_TO_ONE', label: 'One to One', help: 'One release and one test case' },
  { value: 'ONE_TO_MANY', label: 'One to Many', help: 'Many releases and one test case' },
  { value: 'BULK', label: 'Bulk', help: 'One release and many test cases' },
  { value: 'MANY_TO_MANY', label: 'Many to Many', help: 'Many releases and many test cases' },
]

export const ReleaseTestCaseAllocationPage: React.FC = () => {
  const { projectId, isProjectRoute } = useProjectScope()
  const toast = useToast()
  const [tab, setTab] = useState<'allocation' | 'qa'>('allocation')
  const [mode, setMode] = useState<AllocationMode>('BULK')
  const [releases, setReleases] = useState<ReleaseRecord[]>([])
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [modules, setModules] = useState<ModuleRecord[]>([])
  const [submodules, setSubmodules] = useState<SubmoduleRecord[]>([])
  const [allocated, setAllocated] = useState<ReleaseTestCaseRecord[]>([])
  const [selectedReleaseIds, setSelectedReleaseIds] = useState<string[]>([])
  const [selectedTestCaseIds, setSelectedTestCaseIds] = useState<string[]>([])
  const [selectedAllocatedIds, setSelectedAllocatedIds] = useState<string[]>([])
  const [moduleId, setModuleId] = useState('')
  const [submoduleId, setSubmoduleId] = useState('')
  const [releaseFilter, setReleaseFilter] = useState('')
  const [search, setSearch] = useState('')
  const [qaOptions, setQaOptions] = useState<AssignedProjectMember[]>([])
  const [qaId, setQaId] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageNumber, setPageNumber] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const load = async () => {
    if (!projectId) return
    setLoading(true)
    const [releaseResult, tcResult, moduleResult, allocationResult] = await Promise.all([
      releaseService.getReleases({ pageNumber: 0, pageSize: 100, filters: { projectId } }),
      releaseTestCaseService.getProjectTestCases(projectId),
      moduleManagementService.getModules(projectId),
      releaseTestCaseService.getAllocated(projectId),
    ])
    setReleases(releaseResult.data.content)
    setTestCases(tcResult.data)
    setModules(moduleResult.data)
    setAllocated(allocationResult.data)
    setSelectedReleaseIds([]); setSelectedTestCaseIds([]); setSelectedAllocatedIds([]); setModuleId(''); setSubmoduleId(''); setReleaseFilter(''); setSearch(''); setPageNumber(0)
    setLoading(false)
  }
  useEffect(() => { if (projectId) load() }, [projectId])
  useEffect(() => {
    if (!projectId || !moduleId) { setSubmodules([]); setSubmoduleId(''); setQaOptions([]); return }
    moduleManagementService.getSubmodules(projectId, moduleId).then((r) => setSubmodules(r.data))
    const module = modules.find((m) => m.id === moduleId)
    moduleManagementService.getAvailableQa(projectId).then((r) => setQaOptions(r.data.filter((p) => module?.qaEmployeeIds.includes(p.employeeId))))
    setSubmoduleId(''); setQaId('')
  }, [projectId, moduleId, modules])

  const singleRelease = mode === 'ONE_TO_ONE' || mode === 'BULK'
  const singleTestCase = mode === 'ONE_TO_ONE' || mode === 'ONE_TO_MANY'
  const toggleRelease = (id: string) => setSelectedReleaseIds((prev) => singleRelease ? [id] : prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  const toggleTest = (id: string) => setSelectedTestCaseIds((prev) => singleTestCase ? [id] : prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const selectedModule = modules.find((m) => m.id === moduleId)
  const selectedSubmodule = submodules.find((s) => s.id === submoduleId)
  const filteredTests = useMemo(() => testCases.filter((tc) => {
    const moduleOkay = !selectedModule || tc.moduleName === selectedModule.name
    const searchOkay = `${tc.testCaseKey} ${tc.title}`.toLowerCase().includes(search.toLowerCase())
    return moduleOkay && searchOkay
  }), [testCases, selectedModule, search])

  const pageTests = filteredTests.slice(pageNumber * pageSize, pageNumber * pageSize + pageSize)
  const page = { content: pageTests, pageNumber, pageSize, totalElements: filteredTests.length, totalPages: Math.max(1, Math.ceil(filteredTests.length / pageSize)) }

  const filteredAllocated = useMemo(() => allocated.filter((r) => {
    if (r.status !== 'NOT_STARTED') return false
    if (releaseFilter && r.releaseId !== releaseFilter) return false
    if (selectedModule && r.moduleName !== selectedModule.name) return false
    if (selectedSubmodule && r.submoduleName !== selectedSubmodule.name) return false
    return `${r.testCaseKey} ${r.title} ${r.assignedQaName ?? ''}`.toLowerCase().includes(search.toLowerCase())
  }), [allocated, releaseFilter, selectedModule, selectedSubmodule, search])

  const allocate = async () => {
    if (!projectId || selectedReleaseIds.length === 0 || selectedTestCaseIds.length === 0) { toast.error('Select the required release and test case records.'); return }
    const result = await releaseTestCaseService.allocate(projectId, selectedReleaseIds, selectedTestCaseIds)
    toast.success(`${result.data.allocated} allocated successfully. ${result.data.skipped} already existed and were skipped.`)
    const refreshed = await releaseTestCaseService.getAllocated(projectId); setAllocated(refreshed.data); setSelectedTestCaseIds([]); setTab('qa')
  }
  const assignQa = async () => {
    if (!qaId || selectedAllocatedIds.length === 0) { toast.error('Select NOT_STARTED test cases and a Module QA member.'); return }
    const result = await releaseTestCaseService.assignQa(selectedAllocatedIds, qaId); toast.success(result.message)
    if (projectId) { const refreshed = await releaseTestCaseService.getAllocated(projectId); setAllocated(refreshed.data) }
    setSelectedAllocatedIds([])
  }

  const content = loading ? <div className="flex h-64 items-center justify-center"><Loader label="Loading allocation workspace..." /></div> : (
    <>
      <div className="mb-5 flex rounded-lg border border-ink-100 bg-white p-1 shadow-panel">
        <button className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${tab === 'allocation' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-50'}`} onClick={() => setTab('allocation')}><Layers3 className="mr-2 inline h-4 w-4" />Release Test Case Allocation</button>
        <button className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${tab === 'qa' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-50'}`} onClick={() => setTab('qa')}><ShieldCheck className="mr-2 inline h-4 w-4" />QA Allocation</button>
      </div>

      {tab === 'allocation' ? <div className="space-y-4">
        <Card title="1. Choose Allocation Mode" subtitle="Bulk is recommended for normal release planning">
          <div className="grid gap-3 md:grid-cols-4">{MODES.map((item) => <button key={item.value} onClick={() => { setMode(item.value); setSelectedReleaseIds([]); setSelectedTestCaseIds([]) }} className={`rounded-xl border-2 p-4 text-left shadow-sm transition-all duration-150 ${mode === item.value ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200 ring-offset-1' : 'border-ink-300 bg-white hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50/50 hover:shadow-panel'}`}><div className="flex items-center justify-between gap-2"><p className={`font-semibold ${mode === item.value ? 'text-brand-700' : 'text-ink-900'}`}>{item.label}</p>{mode === item.value && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm"><CheckCircle2 className="h-4 w-4" /></span>}</div><p className="mt-1.5 text-xs leading-5 text-ink-500">{item.help}</p></button>)}</div>
        </Card>
        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.4fr]">
          <Card title="2. Select Release" subtitle={singleRelease ? 'Choose one release' : 'Choose one or more releases'}>
            <div className="space-y-2">{releases.length === 0 ? <EmptyState title="No releases" description="Create a release before allocating test cases." /> : releases.map((r) => <label key={r.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${selectedReleaseIds.includes(r.id) ? 'border-brand-400 bg-brand-50' : 'border-ink-100'}`}><input type={singleRelease ? 'radio' : 'checkbox'} name="release" checked={selectedReleaseIds.includes(r.id)} onChange={() => toggleRelease(r.id)} /><div className="flex-1"><p className="font-medium text-ink-900">{r.name} <span className="text-xs text-ink-500">v{r.version}</span></p><p className="text-xs text-ink-500">{r.releaseTypeName}</p></div><Badge tone={r.status === 'ACTIVE' ? 'success' : 'neutral'}>{r.status}</Badge></label>)}</div>
          </Card>
          <Card title="3. Select Test Cases" subtitle={singleTestCase ? 'Choose one test case' : 'Select individually, by module, or by submodule'} actions={!singleTestCase ? <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => setSelectedTestCaseIds(filteredTests.map((t) => t.id))}>Select All</Button><Button size="sm" variant="ghost" onClick={() => setSelectedTestCaseIds([])}>Clear All</Button></div> : undefined}>
            <div className="mb-3 grid gap-2 md:grid-cols-3"><Dropdown options={modules.map((m) => ({ label: m.name, value: m.id }))} value={moduleId} onChange={(e) => setModuleId(e.target.value)} placeholder="All modules" /><Dropdown options={submodules.map((s) => ({ label: s.name, value: s.id }))} value={submoduleId} onChange={(e) => setSubmoduleId(e.target.value)} placeholder="All submodules" disabled={!moduleId} /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search test case..." leftIcon={<Search className="h-4 w-4" />} /></div>
            <div className="mb-2 flex items-center justify-between text-xs text-ink-500"><span>{selectedTestCaseIds.length} selected</span>{submoduleId && !singleTestCase && <Button size="sm" variant="outline" onClick={() => setSelectedTestCaseIds(filteredTests.map((t) => t.id))}>Select this submodule</Button>}</div>
            <div className="max-h-96 space-y-1 overflow-y-auto rounded-lg border border-ink-100 p-2">{pageTests.map((tc) => <label key={tc.id} className={`flex cursor-pointer gap-3 rounded-md p-2 hover:bg-ink-50 ${selectedTestCaseIds.includes(tc.id) ? 'bg-brand-50' : ''}`}><input type={singleTestCase ? 'radio' : 'checkbox'} name="testcase" checked={selectedTestCaseIds.includes(tc.id)} onChange={() => toggleTest(tc.id)} /><div><p className="text-sm font-medium text-ink-900"><span className="mr-2 font-mono text-xs text-brand-600">{tc.testCaseKey}</span>{tc.title}</p><p className="text-xs text-ink-500">{tc.moduleName}</p></div></label>)}</div>
            <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={(size) => { setPageSize(size); setPageNumber(0) }} />
          </Card>
        </div>
        <Card title="Allocation Summary" subtitle="Existing relationships are skipped without failing the batch">
          <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-md bg-ink-50 p-3"><p className="text-xs text-ink-500">Selected Releases</p><p className="text-xl font-semibold text-ink-900">{selectedReleaseIds.length}</p></div><div className="rounded-md bg-ink-50 p-3"><p className="text-xs text-ink-500">Selected Test Cases</p><p className="text-xl font-semibold text-ink-900">{selectedTestCaseIds.length}</p></div><div className="rounded-md bg-brand-50 p-3"><p className="text-xs text-brand-600">Total Combinations</p><p className="text-xl font-semibold text-brand-700">{selectedReleaseIds.length * selectedTestCaseIds.length}</p></div></div>
          <div className="mt-4 flex justify-end"><Button rightIcon={<ArrowRight className="h-4 w-4" />} disabled={!selectedReleaseIds.length || !selectedTestCaseIds.length} onClick={allocate}>Allocate Test Cases</Button></div>
        </Card>
      </div> : <div className="space-y-4">
        <Card title="QA Allocation Filters" subtitle="Only NOT_STARTED release test cases are available for assignment">
          <div className="grid gap-3 md:grid-cols-4"><Dropdown options={releases.map((r) => ({ label: `${r.name} (${r.version})`, value: r.id }))} value={releaseFilter} onChange={(e) => setReleaseFilter(e.target.value)} placeholder="All releases" /><Dropdown options={modules.map((m) => ({ label: m.name, value: m.id }))} value={moduleId} onChange={(e) => setModuleId(e.target.value)} placeholder="All modules" /><Dropdown options={submodules.map((s) => ({ label: s.name, value: s.id }))} value={submoduleId} onChange={(e) => setSubmoduleId(e.target.value)} placeholder="All submodules" disabled={!moduleId} /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search test case or QA..." leftIcon={<Search className="h-4 w-4" />} /></div>
        </Card>
        <div className="grid gap-4 xl:grid-cols-[1.5fr_0.7fr]">
          <Card title="NOT_STARTED Test Cases" subtitle={`${filteredAllocated.length} available`} actions={<div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => setSelectedAllocatedIds(filteredAllocated.map((r) => r.id))}>Select All</Button><Button size="sm" variant="ghost" onClick={() => setSelectedAllocatedIds([])}>Clear All</Button></div>}>
            <div className="max-h-[520px] space-y-2 overflow-y-auto">{filteredAllocated.length === 0 ? <EmptyState title="No test cases available" description="Only NOT_STARTED allocated test cases appear here." /> : filteredAllocated.map((r) => <label key={r.id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${selectedAllocatedIds.includes(r.id) ? 'border-brand-400 bg-brand-50' : 'border-ink-100'}`}><input type="checkbox" checked={selectedAllocatedIds.includes(r.id)} onChange={() => setSelectedAllocatedIds((prev) => prev.includes(r.id) ? prev.filter((id) => id !== r.id) : [...prev, r.id])} /><div className="min-w-0 flex-1"><p className="font-medium text-ink-900"><span className="mr-2 font-mono text-xs text-brand-600">{r.testCaseKey}</span>{r.title}</p><p className="mt-1 text-xs text-ink-500">{r.moduleName} / {r.submoduleName}</p><div className="mt-2 flex gap-2"><Badge tone="neutral">NOT_STARTED</Badge>{r.assignedQaName && <Badge tone="info">{r.assignedQaName}</Badge>}</div></div></label>)}</div>
          </Card>
          <Card title="Assign Module QA" subtitle="QA list comes only from the selected module">
            {!moduleId ? <EmptyState title="Select a module" description="Choose a module to load its assigned QA and QA Leads." /> : qaOptions.length === 0 ? <EmptyState title="No Module QA" description="Assign QA members in Module Management first." /> : <div className="space-y-4"><Dropdown label="QA / QA Lead" required options={qaOptions.map((q) => ({ label: `${q.employeeName} — ${q.roleName}`, value: q.employeeId }))} value={qaId} onChange={(e) => setQaId(e.target.value)} /><div className="rounded-md bg-ink-50 p-3 text-sm text-ink-600"><Users className="mr-2 inline h-4 w-4" />{selectedAllocatedIds.length} test cases selected</div><Button fullWidth leftIcon={<ShieldCheck className="h-4 w-4" />} disabled={!qaId || !selectedAllocatedIds.length} onClick={assignQa}>Assign / Reassign QA</Button><p className="text-xs text-ink-500"><XCircle className="mr-1 inline h-3.5 w-3.5" />PASSED and FAILED test cases cannot be reassigned.</p></div>}
          </Card>
        </div>
      </div>}
    </>
  )

  return <div><PageHeader title="Test Case Allocation" description="Allocate project test cases to releases, then assign NOT_STARTED records to Module QA." actions={<ProjectSelector />} /><ProjectModuleGate isProjectRoute={isProjectRoute}>{content}</ProjectModuleGate></div>
}
