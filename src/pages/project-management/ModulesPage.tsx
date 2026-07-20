import React, { useEffect, useMemo, useState } from 'react'
import { Bug, CheckSquare2, Code2, Edit3, Plus, Save, Search as SearchIcon, Trash2, Users, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectSelector } from '@/components/projects/ProjectSelector'
import { ProjectModuleGate } from '@/components/projects/ProjectSelectionGate'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { Modal } from '@/components/common/Modal'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { Loader } from '@/components/common/Loader'
import { useProjectScope } from '@/hooks/useProjectScope'
import { moduleManagementService } from '@/services/moduleManagementService'
import { AssignedProjectMember, ModuleRecord, SubmoduleRecord } from '@/types/moduleManagement'
import { useToast } from '@/context/ToastContext'
import { notifyModuleReferenceDataChanged } from '@/utils/referenceDataEvents'

interface FormState { name: string; description: string }
const emptyForm: FormState = { name: '', description: '' }

const PersonPicker: React.FC<{
  title: string
  icon: React.ReactNode
  options: AssignedProjectMember[]
  selected: string[]
  onChange: (ids: string[]) => void
  emptyText: string
}> = ({ title, icon, options, selected, onChange, emptyText }) => {
  const [query, setQuery] = useState('')
  const filtered = options.filter((p) => p.employeeName.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">{icon}{title}</div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => onChange(options.map((p) => p.employeeId))}>Select All</Button>
          <Button size="sm" variant="ghost" onClick={() => onChange([])}>Clear All</Button>
        </div>
      </div>
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employee..." leftIcon={<SearchIcon className="h-4 w-4" />} />
      <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border border-ink-100 p-2">
        {filtered.length === 0 ? <p className="px-2 py-4 text-center text-xs text-ink-500">{emptyText}</p> : filtered.map((person) => {
          const checked = selected.includes(person.employeeId)
          return (
            <label key={person.employeeId} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-ink-50">
              <input type="checkbox" className="mt-1" checked={checked} onChange={() => onChange(checked ? selected.filter((id) => id !== person.employeeId) : [...selected, person.employeeId])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-800">{person.employeeName}</p>
                <p className="text-xs text-ink-500">{person.roleName} · {person.allocationPercentage}% · {person.startDate} to {person.endDate}</p>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export const ModulesPage: React.FC = () => {
  const { projectId, isProjectRoute } = useProjectScope()
  const toast = useToast()
  const [modules, setModules] = useState<ModuleRecord[]>([])
  const [submodules, setSubmodules] = useState<SubmoduleRecord[]>([])
  const [qaOptions, setQaOptions] = useState<AssignedProjectMember[]>([])
  const [developerOptions, setDeveloperOptions] = useState<AssignedProjectMember[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [selectedSubmoduleId, setSelectedSubmoduleId] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [modal, setModal] = useState<'module-create' | 'module-edit' | 'sub-create' | 'sub-edit' | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')

  const selectedModule = modules.find((m) => m.id === selectedModuleId)
  const selectedSubmodule = submodules.find((s) => s.id === selectedSubmoduleId)

  const loadModules = async () => {
    if (!projectId) return
    setIsLoading(true)
    const [moduleResult, qaResult, devResult] = await Promise.all([
      moduleManagementService.getModules(projectId),
      moduleManagementService.getAvailableQa(projectId),
      moduleManagementService.getAvailableDevelopers(projectId),
    ])
    setModules(moduleResult.data)
    setQaOptions(qaResult.data)
    setDeveloperOptions(devResult.data)
    const next = moduleResult.data.find((m) => m.id === selectedModuleId)?.id ?? moduleResult.data[0]?.id ?? ''
    setSelectedModuleId(next)
    setIsLoading(false)
  }

  useEffect(() => { setSelectedModuleId(''); setSelectedSubmoduleId(''); setSearch(''); if (projectId) loadModules() }, [projectId])
  useEffect(() => {
    if (!projectId || !selectedModuleId) { setSubmodules([]); setSelectedSubmoduleId(''); return }
    moduleManagementService.getSubmodules(projectId, selectedModuleId).then((r) => {
      setSubmodules(r.data)
      setSelectedSubmoduleId((current) => r.data.some((s) => s.id === current) ? current : r.data[0]?.id ?? '')
    })
  }, [projectId, selectedModuleId])

  const filteredModules = useMemo(() => modules.filter((m) => `${m.name} ${m.description}`.toLowerCase().includes(search.toLowerCase())), [modules, search])
  const openForm = (kind: typeof modal, item?: ModuleRecord | SubmoduleRecord) => { setModal(kind); setForm(item ? { name: item.name, description: item.description } : emptyForm); setError('') }
  const save = async () => {
    const name = form.name.trim()
    if (!name) { setError(`${modal?.startsWith('sub') ? 'Submodule' : 'Module'} Name is required.`); return }
    if (!projectId) return
    const result = modal === 'module-create' ? await moduleManagementService.createModule(projectId, form)
      : modal === 'module-edit' ? await moduleManagementService.updateModule(selectedModuleId, form)
      : modal === 'sub-create' ? await moduleManagementService.createSubmodule(projectId, selectedModuleId, form)
      : await moduleManagementService.updateSubmodule(selectedSubmoduleId, form)
    if (!result.success) { setError(result.message); return }
    toast.success(result.message); setModal(null); notifyModuleReferenceDataChanged(); await loadModules()
    if (selectedModuleId) { const subs = await moduleManagementService.getSubmodules(projectId, selectedModuleId); setSubmodules(subs.data) }
  }

  const deleteModule = async (item: ModuleRecord) => { const r = await moduleManagementService.deleteModule(item.id); r.success ? toast.success(r.message) : toast.error(r.message); if (r.success) { notifyModuleReferenceDataChanged(); loadModules() } }
  const deleteSubmodule = async (item: SubmoduleRecord) => { const r = await moduleManagementService.deleteSubmodule(item.id); r.success ? toast.success(r.message) : toast.error(r.message); if (r.success && projectId) { notifyModuleReferenceDataChanged(); const subs = await moduleManagementService.getSubmodules(projectId, selectedModuleId); setSubmodules(subs.data); loadModules() } }
  const saveQa = async (ids: string[]) => { if (!selectedModule) return; const r = await moduleManagementService.assignQa(selectedModule.id, ids); setModules((prev) => prev.map((m) => m.id === selectedModule.id ? r.data : m)); toast.success(r.message) }
  const saveDevelopers = async (ids: string[]) => { if (!selectedSubmodule) return; const r = await moduleManagementService.assignDevelopers(selectedSubmodule.id, ids); setSubmodules((prev) => prev.map((s) => s.id === selectedSubmodule.id ? r.data : s)); toast.success(r.message) }

  const content = isLoading ? <div className="flex h-64 items-center justify-center"><Loader label="Loading module workspace..." /></div> : (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1fr_1.15fr]">
      <Card title="Modules" subtitle="Select a module to manage QA and submodules" actions={<Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm('module-create')}>New</Button>}>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search modules..." leftIcon={<SearchIcon className="h-4 w-4" />} />
        <div className="mt-3 max-h-[560px] space-y-2 overflow-y-auto">
          {filteredModules.length === 0 ? <EmptyState title="No modules found" description="Create the first module for this project." /> : filteredModules.map((module) => (
            <button key={module.id} onClick={() => setSelectedModuleId(module.id)} className={`w-full rounded-lg border p-3 text-left transition ${selectedModuleId === module.id ? 'border-brand-400 bg-brand-50' : 'border-ink-100 bg-white hover:border-ink-200 hover:bg-ink-50'}`}>
              <div className="flex items-start justify-between gap-2"><div><p className="font-medium text-ink-900">{module.name}</p><p className="mt-1 line-clamp-2 text-xs text-ink-500">{module.description}</p></div><Badge tone="info">{module.submoduleCount}</Badge></div>
              <div className="mt-3 flex gap-3 text-xs text-ink-500"><span><Users className="mr-1 inline h-3.5 w-3.5" />{module.qaEmployeeIds.length} QA</span><span><CheckSquare2 className="mr-1 inline h-3.5 w-3.5" />{module.testCaseCount}</span><span><Bug className="mr-1 inline h-3.5 w-3.5" />{module.defectCount}</span></div>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Submodules" subtitle={selectedModule ? `Under ${selectedModule.name}` : 'Select a module first'} actions={selectedModule ? <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => openForm('sub-create')}>New</Button> : undefined}>
        {!selectedModule ? <EmptyState title="Select a module" description="Choose a module to view its submodules." /> : <div className="space-y-2">
          {submodules.length === 0 ? <EmptyState title="No submodules" description="Create a submodule for this module." /> : submodules.map((sub) => (
            <div key={sub.id} className={`rounded-lg border p-3 ${selectedSubmoduleId === sub.id ? 'border-brand-400 bg-brand-50' : 'border-ink-100'}`}>
              <button className="w-full text-left" onClick={() => setSelectedSubmoduleId(sub.id)}><p className="font-medium text-ink-900">{sub.name}</p><p className="mt-1 text-xs text-ink-500">{sub.description}</p><div className="mt-2 flex gap-3 text-xs text-ink-500"><span><Code2 className="mr-1 inline h-3.5 w-3.5" />{sub.developerEmployeeIds.length} Dev</span><span><CheckSquare2 className="mr-1 inline h-3.5 w-3.5" />{sub.testCaseCount}</span><span><Bug className="mr-1 inline h-3.5 w-3.5" />{sub.defectCount}</span></div></button>
              <div className="mt-2 flex justify-end gap-1"><Button size="sm" variant="ghost" leftIcon={<Edit3 className="h-3.5 w-3.5" />} onClick={() => openForm('sub-edit', sub)}>Edit</Button><Button size="sm" variant="ghost" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => deleteSubmodule(sub)}>Delete</Button></div>
            </div>
          ))}
        </div>}
      </Card>

      <div className="space-y-4">
        <Card title="Module QA Team" subtitle={selectedModule?.name ?? 'Select a module'} actions={selectedModule ? <div className="flex gap-1"><Button size="sm" variant="ghost" leftIcon={<Edit3 className="h-3.5 w-3.5" />} onClick={() => openForm('module-edit', selectedModule)}>Edit</Button><Button size="sm" variant="ghost" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => deleteModule(selectedModule)}>Delete</Button></div> : undefined}>
          {selectedModule ? <PersonPicker title="Assigned QA Members" icon={<Users className="h-4 w-4 text-brand-600" />} options={qaOptions} selected={selectedModule.qaEmployeeIds} onChange={saveQa} emptyText="No active QA or QA Lead is allocated to this project." /> : <EmptyState title="Select a module" description="QA is assigned at module level." />}
        </Card>
        <Card title="Submodule Developers" subtitle={selectedSubmodule?.name ?? 'Select a submodule'}>
          {selectedSubmodule ? <PersonPicker title="Assigned Developers" icon={<Code2 className="h-4 w-4 text-brand-600" />} options={developerOptions} selected={selectedSubmodule.developerEmployeeIds} onChange={saveDevelopers} emptyText="No active developer is allocated to this project." /> : <EmptyState title="Select a submodule" description="Developers are assigned at submodule level." />}
        </Card>
      </div>
    </div>
  )

  return <div><PageHeader title="Module Management" description="Manage modules, module QA teams, submodules, and submodule developers." actions={!isProjectRoute ? <ProjectSelector /> : undefined} /><ProjectModuleGate isProjectRoute={isProjectRoute}>{content}</ProjectModuleGate>
    <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.includes('sub') ? `${modal.includes('edit') ? 'Edit' : 'Create'} Submodule` : `${modal?.includes('edit') ? 'Edit' : 'Create'} Module`} footer={<><Button variant="ghost" leftIcon={<X className="h-4 w-4" />} onClick={() => setModal(null)}>Cancel</Button><Button leftIcon={<Save className="h-4 w-4" />} onClick={save}>Save</Button></>}>
      <div className="space-y-4"><Input label={modal?.includes('sub') ? 'Submodule Name' : 'Module Name'} required value={form.name} error={error} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); if (e.target.value.trim()) setError('') }} /><div><label className="mb-1.5 block text-sm font-medium text-ink-700">Description</label><textarea className="min-h-24 w-full rounded-md border border-ink-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div></div>
    </Modal>
  </div>
}
