import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  AlertTriangle, Bug, CheckCircle2, ChevronDown, ChevronUp, Clock, ExternalLink,
  Filter as FilterIcon, ListChecks, Paperclip, Sparkles, UserCheck, XCircle, X,
} from 'lucide-react'
import { Badge, severityTone } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Dropdown } from '@/components/common/Dropdown'
import { Input } from '@/components/common/Input'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Loader } from '@/components/common/Loader'
import { Modal } from '@/components/common/Modal'
import { Pagination } from '@/components/common/Pagination'
import { Search } from '@/components/common/Search'
import { Table, TableColumn } from '@/components/common/Table'
import { ProjectWorkspaceOutletContext } from '@/components/projects/ProjectWorkspaceLayout'
import { PRIV } from '@/constants/privileges'
import { useConfirm } from '@/context/ConfirmContext'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { usePagination } from '@/hooks/usePagination'
import { useRelease } from '@/hooks/useRelease'
import { defectService } from '@/services/defectService'
import { moduleManagementService } from '@/services/moduleManagementService'
import { releaseTestCaseExecutionService } from '@/services/releaseTestCaseExecutionService'
import { DefectRecord, DefectTypeConfig, PriorityConfig, SeverityConfig } from '@/types/defect'
import { AssignedProjectMember, ModuleRecord } from '@/types/moduleManagement'
import { ReleaseRecord } from '@/types/release'
import {
  EligibleSubmoduleDeveloper,
  ReleaseTestCaseExecutionFilters,
  ReleaseTestCaseExecutionSummary,
  ReleaseTestCaseRecord,
} from '@/types/releaseTestCase'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'

type TabKey = 'mine' | 'all'

const EMPTY_FILTERS: ReleaseTestCaseExecutionFilters = {
  moduleId: '', submoduleId: '', defectTypeId: '', severityId: '', status: '', assignedQaId: '', defectCreated: '', defectNo: '',
}

const STATUS_TONE: Record<string, 'neutral' | 'success' | 'critical'> = {
  NOT_STARTED: 'neutral', PASSED: 'success', FAILED: 'critical',
}
const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: 'Not Started', PASSED: 'Passed', FAILED: 'Failed',
}
const STATUS_ICON: Record<string, React.ReactNode> = {
  NOT_STARTED: <Clock className="h-3 w-3" />,
  PASSED: <CheckCircle2 className="h-3 w-3" />,
  FAILED: <XCircle className="h-3 w-3" />,
}

const EMPTY_SUMMARY: ReleaseTestCaseExecutionSummary = {
  total: 0, myAssigned: 0, notStarted: 0, passed: 0, failed: 0, defectsCreated: 0,
}

interface FailFormState {
  priorityId: string
  assignedToId: string
  attachmentName?: string
}

function StatusPill({ status }: { status: string }) {
  return (
    <Badge tone={STATUS_TONE[status]}>
      <span className="inline-flex items-center gap-1">{STATUS_ICON[status]}{STATUS_LABEL[status]}</span>
    </Badge>
  )
}

interface SummaryCardDef {
  key: keyof ReleaseTestCaseExecutionSummary
  label: string
  subtitle: string
  icon: React.ReactNode
  gradient: string
}

const SUMMARY_CARDS: SummaryCardDef[] = [
  { key: 'total', label: 'Total Test Cases', subtitle: 'Allocated to this release', icon: <ListChecks className="h-5 w-5" />, gradient: 'from-brand-500 to-brand-700' },
  { key: 'myAssigned', label: 'My Assigned', subtitle: 'Test cases assigned to you', icon: <UserCheck className="h-5 w-5" />, gradient: 'from-indigo-500 to-indigo-700' },
  { key: 'notStarted', label: 'Not Started', subtitle: 'Awaiting execution', icon: <Clock className="h-5 w-5" />, gradient: 'from-slate-400 to-slate-600' },
  { key: 'passed', label: 'Passed', subtitle: 'Executed successfully', icon: <CheckCircle2 className="h-5 w-5" />, gradient: 'from-emerald-500 to-emerald-700' },
  { key: 'failed', label: 'Failed', subtitle: 'Execution failures', icon: <XCircle className="h-5 w-5" />, gradient: 'from-rose-500 to-rose-700' },
  { key: 'defectsCreated', label: 'Defects Created', subtitle: 'Linked to failed cases', icon: <Bug className="h-5 w-5" />, gradient: 'from-amber-500 to-orange-600' },
]

function AnimatedCount({ value }: { value: number }) {
  return <span key={value} className="exec-count block text-2xl font-bold text-white">{value}</span>
}

export const ReleaseTestCaseExecutionPage: React.FC = () => {
  const { project } = useOutletContext<ProjectWorkspaceOutletContext>()
  const { user, hasPrivilege } = useAuth()
  const { selectedRelease, setSelectedRelease, clearSelectedRelease, releaseRevision } = useRelease()
  const toast = useToast()
  const confirm = useConfirm()

  const canViewAll = hasPrivilege(PRIV.TESTCASE_EXECUTION_VIEW_ALL)
  const canExecute = hasPrivilege(PRIV.TESTCASE_EXECUTE)
  const canFailCreateDefect = hasPrivilege(PRIV.TESTCASE_FAIL_CREATE_DEFECT)

  const [activeRelease, setActiveRelease] = useState<ReleaseRecord | null>(null)
  const [isReleaseLoading, setIsReleaseLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('mine')
  const [counts, setCounts] = useState({ myTestCases: 0, allTestCases: 0 })
  const [summary, setSummary] = useState<ReleaseTestCaseExecutionSummary>(EMPTY_SUMMARY)
  const [refreshToken, setRefreshToken] = useState(0)

  const [modules, setModules] = useState<ModuleRecord[]>([])
  const [defectTypes, setDefectTypes] = useState<DefectTypeConfig[]>([])
  const [severities, setSeverities] = useState<SeverityConfig[]>([])
  const [priorities, setPriorities] = useState<PriorityConfig[]>([])
  const [qaOptions, setQaOptions] = useState<AssignedProjectMember[]>([])

  const [failTarget, setFailTarget] = useState<ReleaseTestCaseRecord | null>(null)
  const [failForm, setFailForm] = useState<FailFormState>({ priorityId: '', assignedToId: '' })
  const [eligibleDevelopers, setEligibleDevelopers] = useState<EligibleSubmoduleDeveloper[]>([])
  const [isLoadingDevelopers, setIsLoadingDevelopers] = useState(false)
  const [failError, setFailError] = useState<string | undefined>()
  const [isFailing, setIsFailing] = useState(false)

  const [defectModalId, setDefectModalId] = useState<string | null>(null)
  const [defectDetails, setDefectDetails] = useState<DefectRecord | null>(null)
  const [isLoadingDefect, setIsLoadingDefect] = useState(false)

  // Load the ACTIVE release for the project whenever the project changes; reset everything else.
  useEffect(() => {
    let cancelled = false
    setIsReleaseLoading(true)
    setActiveRelease(null)
    clearSelectedRelease()
    setTab('mine')
    setFailTarget(null)
    setDefectModalId(null)
    setRefreshToken((t) => t + 1)

    releaseTestCaseExecutionService.getActiveRelease(project.id).then((result) => {
      if (cancelled) return
      if (result.success && result.data) {
        setActiveRelease(result.data)
        setSelectedRelease({ releaseId: result.data.id, projectId: project.id, releaseName: result.data.name, version: result.data.version, status: result.data.status })
      }
      setIsReleaseLoading(false)
    })

    moduleManagementService.getModules(project.id).then((r) => !cancelled && r.success && setModules(r.data))
    moduleManagementService.getAvailableQa(project.id).then((r) => !cancelled && r.success && setQaOptions(r.data))
    defectService.getDefectTypes({ pageNumber: 0, pageSize: 100 }).then((r) => !cancelled && r.success && setDefectTypes(r.data.content))
    defectService.getSeverities({ pageNumber: 0, pageSize: 100 }).then((r) => !cancelled && r.success && setSeverities(r.data.content))
    defectService.getPriorities({ pageNumber: 0, pageSize: 100 }).then((r) => !cancelled && r.success && setPriorities(r.data.content.filter((p) => p.active)))

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, releaseRevision])

  const releaseId = activeRelease?.id
  const employeeId = user?.id ?? ''

  const loadCounts = useCallback(() => {
    if (!releaseId) return
    releaseTestCaseExecutionService.getReleaseTestCaseExecutionCounts(project.id, releaseId, employeeId).then((r) => {
      if (r.success) setCounts(r.data)
    })
    releaseTestCaseExecutionService.getReleaseTestCaseExecutionSummary(project.id, releaseId, employeeId).then((r) => {
      if (r.success) setSummary(r.data)
    })
  }, [project.id, releaseId, employeeId])

  useEffect(() => {
    loadCounts()
  }, [loadCounts, refreshToken])

  const moduleOptions = useMemo(() => modules.map((m) => ({ label: m.name, value: m.id })), [modules])
  const defectTypeOptions = useMemo(() => defectTypes.map((d) => ({ label: d.name, value: d.id })), [defectTypes])
  const severityOptions = useMemo(() => severities.map((s) => ({ label: s.name, value: s.id })), [severities])
  const priorityOptions = useMemo(() => priorities.map((p) => ({ label: p.name, value: p.id })), [priorities])
  const qaFilterOptions = useMemo(() => qaOptions.map((m) => ({ label: m.employeeName, value: m.employeeId })), [qaOptions])
  const statusOptions = [
    { label: 'Not Started', value: 'NOT_STARTED' },
    { label: 'Passed', value: 'PASSED' },
    { label: 'Failed', value: 'FAILED' },
  ]
  const defectCreatedOptions = [
    { label: 'Yes', value: 'YES' },
    { label: 'No', value: 'NO' },
  ]

  const requestFail = (row: ReleaseTestCaseRecord) => {
    setFailTarget(row)
    setFailForm({ priorityId: '', assignedToId: '', attachmentName: row.attachmentName })
    setFailError(undefined)
    setEligibleDevelopers([])
    setIsLoadingDevelopers(true)
    releaseTestCaseExecutionService.getEligibleSubmoduleDevelopers(project.id, row.submoduleId).then((r) => {
      setIsLoadingDevelopers(false)
      if (r.success) setEligibleDevelopers(r.data)
    })
  }

  const requestPass = async (row: ReleaseTestCaseRecord) => {
    const confirmed = await confirm({
      title: 'Mark as Passed',
      message: `Mark ${row.testCaseKey} as PASSED for ${row.releaseName}?`,
      confirmText: 'Mark Passed',
    })
    if (!confirmed) return
    const result = await releaseTestCaseExecutionService.patchReleaseTestCaseStatus(row.id, {
      status: 'PASSED', executedBy: employeeId, version: row.version,
    })
    if (result.success) {
      toast.success(result.message)
      setRefreshToken((t) => t + 1)
    } else toast.error(result.message)
  }

  const submitFail = async () => {
    if (!failTarget) return
    if (!failForm.priorityId) {
      setFailError('Priority is required.')
      return
    }
    if (!failForm.assignedToId) {
      setFailError('Assign To Developer is required.')
      return
    }
    setIsFailing(true)
    const result = await releaseTestCaseExecutionService.failReleaseTestCaseAndCreateDefect(failTarget.id, {
      priorityId: failForm.priorityId,
      assignedToId: failForm.assignedToId,
      attachmentName: failForm.attachmentName,
      executedBy: employeeId,
      version: failTarget.version,
    })
    setIsFailing(false)
    if (result.success) {
      toast.success(result.message)
      setFailTarget(null)
      setRefreshToken((t) => t + 1)
    } else setFailError(result.message)
  }

  const openDefect = (defectId: string) => {
    setDefectModalId(defectId)
    setIsLoadingDefect(true)
    defectService.getDefectById(project.id, defectId).then((r) => {
      setIsLoadingDefect(false)
      if (r.success) setDefectDetails(r.data)
    })
  }

  if (isReleaseLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Card><Loader label="Loading Test Case Execution..." /></Card>
      </div>
    )
  }

  if (!activeRelease) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <EmptyState
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Execution unavailable"
            description="This project has no ACTIVE release. Create or activate a release before executing test cases."
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-indigo-600 p-6 shadow-floating">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-white sm:text-[30px]">Test Case Execution</h1>
              <p className="mt-0.5 text-sm text-white/80">
                {project.name} <span className="mx-1.5 text-white/40">•</span>
                ACTIVE Release: <span className="font-semibold text-white">{activeRelease.name} ({activeRelease.version})</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {SUMMARY_CARDS.map((c) => (
          <div
            key={c.key}
            className={cn(
              'group relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:shadow-floating',
              c.gradient,
            )}
          >
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-125" />
            <div className="relative flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/20">
                {c.icon}
              </div>
            </div>
            <div className="relative mt-3">
              <AnimatedCount value={summary[c.key]} />
              <p className="mt-0.5 text-xs font-semibold text-white/90">{c.label}</p>
              <p className="text-[11px] text-white/65">{c.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pill tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink-100 bg-white p-2 shadow-panel">
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
            tab === 'mine'
              ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-panel'
              : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800',
          )}
        >
          <ListChecks className="h-4 w-4" />
          My Test Cases
          <span className={cn(
            'rounded-full px-2 py-0.5 text-xs font-bold',
            tab === 'mine' ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-500',
          )}
          >
            {counts.myTestCases}
          </span>
        </button>
        {canViewAll && (
          <button
            type="button"
            onClick={() => setTab('all')}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
              tab === 'all'
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-panel'
                : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800',
            )}
          >
            <UserCheck className="h-4 w-4" />
            All Test Cases
            <span className={cn(
              'rounded-full px-2 py-0.5 text-xs font-bold',
              tab === 'all' ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-500',
            )}
            >
              {counts.allTestCases}
            </span>
          </button>
        )}
      </div>

      <div style={{ display: tab === 'mine' ? 'block' : 'none' }}>
        <ExecutionTabPanel
          mode="mine"
          projectId={project.id}
          releaseId={releaseId!}
          employeeId={employeeId}
          refreshToken={refreshToken}
          canExecute={canExecute}
          canFailCreateDefect={canFailCreateDefect}
          moduleOptions={moduleOptions}
          defectTypeOptions={defectTypeOptions}
          severityOptions={severityOptions}
          statusOptions={statusOptions}
          defectCreatedOptions={defectCreatedOptions}
          qaFilterOptions={[]}
          onPass={requestPass}
          onFail={requestFail}
          onViewDefect={openDefect}
        />
      </div>
      {canViewAll && (
        <div style={{ display: tab === 'all' ? 'block' : 'none' }}>
          <ExecutionTabPanel
            mode="all"
            projectId={project.id}
            releaseId={releaseId!}
            employeeId={employeeId}
            refreshToken={refreshToken}
            canExecute={canExecute}
            canFailCreateDefect={canFailCreateDefect}
            moduleOptions={moduleOptions}
            defectTypeOptions={defectTypeOptions}
            severityOptions={severityOptions}
            statusOptions={statusOptions}
            defectCreatedOptions={defectCreatedOptions}
            qaFilterOptions={qaFilterOptions}
            onPass={requestPass}
            onFail={requestFail}
            onViewDefect={openDefect}
          />
        </div>
      )}

      {/* Create Defect From Failed Test Case */}
      <Modal
        isOpen={Boolean(failTarget)}
        onClose={() => !isFailing && setFailTarget(null)}
        title="Create Defect From Failed Test Case"
        size="lg"
        description={failTarget ? `${failTarget.testCaseKey} will be marked FAILED once the defect is created.` : undefined}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setFailTarget(null)} disabled={isFailing}>Cancel</Button>
            <Button
              variant="danger"
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
              leftIcon={<XCircle className="h-4 w-4" />}
              onClick={submitFail}
              isLoading={isFailing}
            >
              Mark Failed &amp; Create Defect
            </Button>
          </>
        )}
      >
        {failTarget && (
          <div className="flex flex-col gap-4">
            {failError && <ErrorMessage message={failError} />}

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
              <InfoCard label="Project" value={project.name} />
              <InfoCard label="Found in Release" value={`${failTarget.releaseName} — ${failTarget.releaseVersion}`} />
              <InfoCard label="Test Case Number" value={failTarget.testCaseKey} accent="brand" />
              <InfoCard label="Module" value={failTarget.moduleName} />
              <InfoCard label="Submodule" value={failTarget.submoduleName} />
              <InfoCard label="Defect Type" value={failTarget.defectTypeName} />
              <div className="col-span-2 sm:col-span-1">
                <InfoCard label="Severity" value={failTarget.severityName} accent="critical" />
              </div>
              <div className="col-span-2">
                <InfoCard label="Test Case Description" value={failTarget.description} />
              </div>
              <div className="col-span-2">
                <InfoCard label="Steps to Recreate" value={failTarget.steps} multiline />
              </div>
            </div>

            {failTarget.attachmentName ? (
              <div className="flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-600 ring-1 ring-inset ring-ink-100">
                <Paperclip className="h-4 w-4 text-brand-500" /> Existing attachment: <span className="font-medium">{failTarget.attachmentName}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-700">Attachment (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFailForm((f) => ({ ...f, attachmentName: e.target.files?.[0]?.name }))}
                  className="text-sm text-ink-600 file:mr-3 file:rounded-full file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink-700 hover:file:bg-ink-200"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-3">
              <div className="col-span-2 -mt-1 mb-0.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                <Sparkles className="h-3.5 w-3.5" /> Required to create defect
              </div>
              <Dropdown
                label="Priority" required options={priorityOptions}
                value={failForm.priorityId}
                onChange={(e) => { setFailForm((f) => ({ ...f, priorityId: e.target.value })); setFailError(undefined) }}
                className="ring-1 ring-inset ring-amber-200"
              />
              <Dropdown
                label="Assign To Developer" required
                options={eligibleDevelopers.map((d) => ({ label: `${d.employeeName} (${d.roleName})`, value: d.employeeId }))}
                value={failForm.assignedToId}
                onChange={(e) => { setFailForm((f) => ({ ...f, assignedToId: e.target.value })); setFailError(undefined) }}
                disabled={isLoadingDevelopers}
                placeholder={isLoadingDevelopers ? 'Loading developers...' : eligibleDevelopers.length === 0 ? 'No eligible developers' : 'Select...'}
                className="ring-1 ring-inset ring-amber-200"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Defect Details (read-only) */}
      <Modal
        isOpen={Boolean(defectModalId)}
        onClose={() => { setDefectModalId(null); setDefectDetails(null) }}
        title="Defect Details"
        description={defectDetails ? defectDetails.defectNo : undefined}
      >
        {isLoadingDefect || !defectDetails ? (
          <Loader label="Loading defect..." />
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <InfoCard label="Defect Number" value={defectDetails.defectNo} accent="brand" />
            <InfoCard label="Status" value={defectDetails.statusName} />
            <InfoCard label="Module" value={defectDetails.moduleName} />
            <InfoCard label="Submodule" value={defectDetails.submoduleName} />
            <InfoCard label="Severity" value={defectDetails.severityName} accent="critical" />
            <InfoCard label="Priority" value={defectDetails.priorityName} />
            <InfoCard label="Assigned Developer" value={defectDetails.assignedToName} />
            <InfoCard label="Release" value={defectDetails.releaseName} />
            <div className="col-span-2">
              <InfoCard label="Description" value={defectDetails.description} multiline />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function InfoCard({
  label, value, multiline, accent,
}: { label: string; value: string; multiline?: boolean; accent?: 'brand' | 'critical' }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-ink-50 p-3 ring-1 ring-inset ring-ink-100 transition-colors',
        accent === 'brand' && 'bg-brand-50 ring-brand-100',
        accent === 'critical' && 'bg-red-50 ring-red-100',
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className={cn('mt-0.5 text-sm font-medium text-ink-800', multiline && 'whitespace-pre-wrap font-normal')}>{value || '—'}</p>
    </div>
  )
}

interface TabPanelProps {
  mode: TabKey
  projectId: string
  releaseId: string
  employeeId: string
  refreshToken: number
  canExecute: boolean
  canFailCreateDefect: boolean
  moduleOptions: { label: string; value: string }[]
  defectTypeOptions: { label: string; value: string }[]
  severityOptions: { label: string; value: string }[]
  statusOptions: { label: string; value: string }[]
  defectCreatedOptions: { label: string; value: string }[]
  qaFilterOptions: { label: string; value: string }[]
  onPass: (row: ReleaseTestCaseRecord) => void
  onFail: (row: ReleaseTestCaseRecord) => void
  onViewDefect: (defectId: string) => void
}

const ExecutionTabPanel: React.FC<TabPanelProps> = ({
  mode, projectId, releaseId, employeeId, refreshToken, canExecute, canFailCreateDefect,
  moduleOptions, defectTypeOptions, severityOptions, statusOptions, defectCreatedOptions, qaFilterOptions,
  onPass, onFail, onViewDefect,
}) => {
  const [filters, setFilters] = useState<ReleaseTestCaseExecutionFilters>(EMPTY_FILTERS)
  const [submoduleOptions, setSubmoduleOptions] = useState<{ label: string; value: string }[]>([])
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  useEffect(() => {
    setFilters(EMPTY_FILTERS)
    setSubmoduleOptions([])
  }, [releaseId])

  useEffect(() => {
    if (!filters.moduleId) {
      setSubmoduleOptions([])
      return
    }
    let cancelled = false
    moduleManagementService.getSubmodules(projectId, filters.moduleId as string).then((r) => {
      if (!cancelled && r.success) setSubmoduleOptions(r.data.map((s) => ({ label: s.name, value: s.id })))
    })
    return () => {
      cancelled = true
    }
  }, [filters.moduleId, projectId])

  const fetcher = useCallback(
    (request: Parameters<typeof releaseTestCaseExecutionService.getAllReleaseTestCaseExecutions>[3]) =>
      mode === 'mine'
        ? releaseTestCaseExecutionService.getMyReleaseTestCaseExecutions(projectId, releaseId, employeeId, filters, request)
        : releaseTestCaseExecutionService.getAllReleaseTestCaseExecutions(projectId, releaseId, filters, request),
    [mode, projectId, releaseId, employeeId, filters],
  )

  const {
    page, isLoading, error, search, setSearch, setPageNumber, setPageSize, reload,
  } = usePagination<ReleaseTestCaseRecord>({
    fetcher,
    initialPageSize: 10,
    filters: filters as unknown as Record<string, string | number | boolean | undefined>,
    enabled: Boolean(releaseId),
  })

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken])

  useEffect(() => {
    setSearch('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releaseId])

  const clearFilters = () => setFilters(EMPTY_FILTERS)
  const activeFilterCount = Object.values(filters).filter((v) => v).length
  const hasActiveFilters = activeFilterCount > 0

  const columns: TableColumn<ReleaseTestCaseRecord>[] = [
    { key: 'testCaseKey', header: 'Test Case Number', sticky: 'left', width: '160px', render: (r) => <span className="font-semibold text-ink-900">{r.testCaseKey}</span> },
    { key: 'description', header: 'Description', width: '260px', render: (r) => <span className="line-clamp-2 max-w-xs text-ink-700">{r.description}</span> },
    { key: 'moduleName', header: 'Module', render: (r) => r.moduleName },
    { key: 'submoduleName', header: 'Submodule', render: (r) => r.submoduleName },
    { key: 'defectTypeName', header: 'Defect Type', render: (r) => r.defectTypeName },
    { key: 'severityName', header: 'Severity', render: (r) => <Badge tone={severityTone(r.severityName)}>{r.severityName}</Badge> },
    { key: 'assignedQaName', header: 'Assigned QA', render: (r) => r.assignedQaName ?? '—' },
    { key: 'status', header: 'Execution Status', render: (r) => <StatusPill status={r.status} /> },
    {
      key: 'defectNo', header: 'Defect Number',
      render: (r) => r.defectId ? (
        <button type="button" onClick={() => onViewDefect(r.defectId!)} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100 transition-colors hover:bg-brand-100">
          {r.defectNo} <ExternalLink className="h-3 w-3" />
        </button>
      ) : '—',
    },
    { key: 'defectAssignedToName', header: 'Defect Assigned Developer', render: (r) => r.defectAssignedToName ?? '—' },
    { key: 'executedDate', header: 'Executed Date', render: (r) => r.executedDate ? formatDate(r.executedDate) : '—' },
    {
      key: 'actions', header: 'Actions', align: 'right', width: '190px',
      render: (r) => {
        const isMine = r.assignedQaId === employeeId
        const allowed = canExecute && isMine
        if (r.status === 'FAILED') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink-50 px-2.5 py-1 text-xs italic text-ink-400" title="This test case has failed and a defect has already been created.">
              Failed — defect already created
            </span>
          )
        }
        return (
          <div className="flex items-center justify-end gap-1.5">
            {r.status === 'NOT_STARTED' && (
              <button
                type="button"
                disabled={!allowed}
                onClick={() => onPass(r)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white shadow-sm transition-all',
                  allowed
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-panel'
                    : 'cursor-not-allowed bg-ink-200 text-ink-400',
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Pass
              </button>
            )}
            <button
              type="button"
              disabled={!allowed || !canFailCreateDefect}
              onClick={() => onFail(r)}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white shadow-sm transition-all',
                allowed && canFailCreateDefect
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 hover:shadow-panel'
                  : 'cursor-not-allowed bg-ink-200 text-ink-400',
              )}
            >
              <XCircle className="h-3.5 w-3.5" /> Fail
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Filter card */}
      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-ink-50 to-white p-4">
          <Search value={search} onChange={setSearch} placeholder="Search by Test Case Number or Description..." />
          <button
            type="button"
            onClick={() => setIsFiltersOpen((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold shadow-sm transition-all',
              isFiltersOpen || hasActiveFilters
                ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
            )}
          >
            <FilterIcon className="h-4 w-4" /> Filters
            {hasActiveFilters && (
              <span className="rounded-full bg-white/25 px-1.5 text-xs font-bold">{activeFilterCount}</span>
            )}
            {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <div className={cn('grid transition-all duration-200 ease-out', isFiltersOpen ? 'exec-animate-in grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
          <div className="overflow-hidden">
            <div className="flex flex-col gap-3 border-t border-ink-100 bg-ink-50/50 p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <Dropdown placeholder="Module" options={moduleOptions} value={filters.moduleId} onChange={(e) => setFilters((f) => ({ ...f, moduleId: e.target.value, submoduleId: '' }))} />
                <Dropdown placeholder="Submodule" options={submoduleOptions} value={filters.submoduleId} onChange={(e) => setFilters((f) => ({ ...f, submoduleId: e.target.value }))} disabled={!filters.moduleId} />
                <Dropdown placeholder="Defect Type" options={defectTypeOptions} value={filters.defectTypeId} onChange={(e) => setFilters((f) => ({ ...f, defectTypeId: e.target.value }))} />
                <Dropdown placeholder="Severity" options={severityOptions} value={filters.severityId} onChange={(e) => setFilters((f) => ({ ...f, severityId: e.target.value }))} />
                <Dropdown placeholder="Execution Status" options={statusOptions} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as ReleaseTestCaseExecutionFilters['status'] }))} />
                {mode === 'all' && (
                  <Dropdown placeholder="Assigned QA" options={qaFilterOptions} value={filters.assignedQaId} onChange={(e) => setFilters((f) => ({ ...f, assignedQaId: e.target.value }))} />
                )}
                <Dropdown placeholder="Defect Created" options={defectCreatedOptions} value={filters.defectCreated} onChange={(e) => setFilters((f) => ({ ...f, defectCreated: e.target.value as ReleaseTestCaseExecutionFilters['defectCreated'] }))} />
                <Input placeholder="Defect Number" value={filters.defectNo ?? ''} onChange={(e) => setFilters((f) => ({ ...f, defectNo: e.target.value }))} />
              </div>
              <div>
                <Button
                  variant="filterClear"
                  size="sm"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  leftIcon={<X className="h-3.5 w-3.5" />}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table + pagination */}
      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-panel">
        <Table
          columns={columns}
          rows={page?.content ?? []}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          emptyTitle="No test cases to execute"
          emptyDescription="No release test case allocations match the current filters."
        />
        <div className="sticky bottom-0 border-t border-ink-100 bg-white/95 backdrop-blur-sm">
          <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
        </div>
      </div>
    </div>
  )
}
