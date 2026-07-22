import React, { useCallback, useEffect, useState } from 'react'
import { Edit, Eye, Plus, RotateCcw, UserCheck, UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Filter, Pagination, Search, Table, TableColumn } from '@/components/common'
import { PageHeader } from '@/components/layout/PageHeader'
import { employeeService } from '@/services/employeeService'
import { designationService } from '@/services/designationService'
import { EmployeeResponse, Gender } from '@/types/employee'
import { Page, PageSizeOption } from '@/types/common'
import { formatDate, initials } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'

const genderLabel = (gender: Gender) => ({ MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' }[gender])

export const EmployeeListPage: React.FC = () => {
  const { hasPrivilege } = useAuth(); const navigate = useNavigate(); const toast = useToast(); const confirm = useConfirm()
  const [page, setPage] = useState<Page<EmployeeResponse> | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(''); const [search, setSearch] = useState('')
  const [designationId, setDesignationId] = useState('All'); const [gender, setGender] = useState('All'); const [status, setStatus] = useState('All')
  const [pageNumber, setPageNumber] = useState(0); const [pageSize, setPageSize] = useState<PageSizeOption>(10); const [sortBy, setSortBy] = useState('firstName'); const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [designationOptions, setDesignationOptions] = useState<{ label: string; value: string }[]>([])

  useEffect(() => { const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPageNumber(0) }, 400); return () => window.clearTimeout(timer) }, [searchInput])
  useEffect(() => { designationService.getDesignations({ pageNumber: 0, pageSize: 100, sortBy: 'title', sortDir: 'asc', filters: { active: true } }).then((r) => r.success && setDesignationOptions(r.data.content.filter((d) => d.active !== false).map((d) => ({ label: d.title, value: d.id })))) }, [])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const result = await employeeService.getEmployees({ search: search || undefined, designationId: designationId === 'All' ? undefined : Number(designationId), gender: gender === 'All' ? undefined : gender as Gender, active: status === 'All' ? undefined : status === 'ACTIVE', page: pageNumber, size: pageSize, sortBy, sortDir })
    if (result.success) setPage(result.data); else setError(result.message)
    setLoading(false)
  }, [search, designationId, gender, status, pageNumber, pageSize, sortBy, sortDir])
  useEffect(() => { void load() }, [load])

  const changeStatus = async (employee: EmployeeResponse) => {
    if (employee.superUser && employee.active) return
    const next = !employee.active; const accepted = await confirm({ title: `${next ? 'Activate' : 'Deactivate'} Employee`, message: `${next ? 'Activate' : 'Deactivate'} ${employee.fullName}?`, confirmText: next ? 'Activate' : 'Deactivate', variant: next ? 'primary' : 'danger' })
    if (!accepted) return
    const result = await employeeService.updateEmployeeStatus(employee.id, next)
    result.success ? toast.success(result.message) : toast.error(result.message)
    if (result.success) void load()
  }
  const clear = () => { setSearchInput(''); setSearch(''); setDesignationId('All'); setGender('All'); setStatus('All'); setPageNumber(0) }
  const sort = (key: string) => { const mapping: Record<string, string> = { employeeCode: 'employeeCode', firstName: 'firstName', gender: 'gender', email: 'email', phoneNo: 'phoneNo', joinDate: 'joinDate', designationName: 'designationName', active: 'active' }; const backend = mapping[key]; if (!backend) return; setPageNumber(0); if (sortBy === backend) setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(backend); setSortDir('asc') } }

  const columns: TableColumn<EmployeeResponse>[] = [
    { key: 'firstName', header: 'Employee', sortable: true, render: (r) => <div className="flex items-center gap-2.5">{r.profileImage ? <img src={r.profileImage} alt={r.fullName} className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: r.avatarColor || '#12507F' }}>{initials(r.fullName)}</span>}<div><div className="flex items-center gap-2"><p className="font-medium text-ink-900">{r.fullName}</p>{r.superUser && <Badge tone="info">Super User</Badge>}</div><p className="text-xs text-ink-400">{r.designationName}</p></div></div> },
    { key: 'employeeCode', header: 'Employee Code', sortable: true, render: (r) => <span className="font-mono text-xs font-semibold text-brand-600">{r.employeeCode}</span> },
    { key: 'gender', header: 'Gender', sortable: true, render: (r) => genderLabel(r.gender) },
    { key: 'email', header: 'Email', sortable: true, render: (r) => r.email }, { key: 'phoneNo', header: 'Phone Number', sortable: true, render: (r) => r.phoneNo },
    { key: 'joinDate', header: 'Join Date', sortable: true, render: (r) => formatDate(r.joinDate) },
    { key: 'designationName', header: 'Designation', sortable: true, render: (r) => r.designationName },
    { key: 'active', header: 'Status', sortable: true, render: (r) => <Badge tone={r.active ? 'success' : 'neutral'} dot>{r.active ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', header: 'Actions', align: 'center', render: (r) => <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>{hasPrivilege(PRIV.EMPLOYEE_VIEW) && <button title="View employee" aria-label={`View ${r.fullName}`} onClick={() => navigate(ROUTES.EMPLOYEE_DETAIL.replace(':id', String(r.id)))} className="rounded p-1.5 text-ink-400 hover:bg-ink-100"><Eye className="h-4 w-4" /></button>}{hasPrivilege(PRIV.EMPLOYEE_UPDATE) && <button title="Edit employee" aria-label={`Edit ${r.fullName}`} onClick={() => navigate(ROUTES.EMPLOYEE_EDIT.replace(':id', String(r.id)))} className="rounded p-1.5 text-ink-400 hover:bg-brand-50 hover:text-brand-600"><Edit className="h-4 w-4" /></button>}{hasPrivilege(PRIV.EMPLOYEE_STATUS_CHANGE) && <button disabled={r.superUser && r.active} title={r.superUser && r.active ? 'The Super User cannot be deactivated' : r.active ? 'Deactivate employee' : 'Activate employee'} aria-label={r.active ? `Deactivate ${r.fullName}` : `Activate ${r.fullName}`} onClick={() => void changeStatus(r)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-35">{r.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}</button>}</div> },
  ]
  return <div className="flex flex-col gap-6"><PageHeader title="Employees" description="Manage employee profiles and account access." actions={hasPrivilege(PRIV.EMPLOYEE_CREATE) ? <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(ROUTES.EMPLOYEE_CREATE)}>Create Employee</Button> : undefined} />
    <div className="flex flex-wrap items-center gap-2"><div className="min-w-72 flex-1"><Search value={searchInput} onChange={setSearchInput} placeholder="Search code, name, email, phone, or designation..." /></div><Filter label="Designation" value={designationId} options={designationOptions} onChange={(v) => { setDesignationId(v); setPageNumber(0) }} /><Filter label="Gender" value={gender} options={[{ label: 'Male', value: 'MALE' }, { label: 'Female', value: 'FEMALE' }, { label: 'Other', value: 'OTHER' }]} onChange={(v) => { setGender(v); setPageNumber(0) }} /><Filter label="Status" value={status} options={[{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }]} onChange={(v) => { setStatus(v); setPageNumber(0) }} /><Button variant="filterClear" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={clear}>Clear Filters</Button></div>
    <div className="overflow-x-auto rounded-lg border border-ink-100 bg-white shadow-panel"><Table columns={columns} rows={page?.content ?? []} rowKey={(r) => String(r.id)} isLoading={loading} error={error} onRetry={load} sortBy={sortBy} sortDir={sortDir} onSort={sort} onRowClick={hasPrivilege(PRIV.EMPLOYEE_VIEW) ? (r) => navigate(ROUTES.EMPLOYEE_DETAIL.replace(':id', String(r.id))) : undefined} emptyTitle="No employees found" emptyDescription="Try adjusting your search or filters." /><Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={(size) => { setPageSize(size); setPageNumber(0) }} /></div>
  </div>
}
