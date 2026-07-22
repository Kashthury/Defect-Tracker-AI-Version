import React, { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Briefcase, Calendar, Mail, Phone, User } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Card, ErrorMessage, Loader } from '@/components/common'
import { PageHeader } from '@/components/layout/PageHeader'
import { employeeService } from '@/services/employeeService'
import { EmployeeResponse, Gender } from '@/types/employee'
import { formatDate, formatDateTime, initials } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'

const genderLabel = (gender: Gender) => ({ MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' }[gender])

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); const navigate = useNavigate(); const { hasPrivilege } = useAuth(); const toast = useToast(); const confirm = useConfirm()
  const [employee, setEmployee] = useState<EmployeeResponse | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [statusLoading, setStatusLoading] = useState(false)
  const load = useCallback(async () => { if (!id) return; setLoading(true); setError(null); const result = await employeeService.getEmployeeById(id); result.success ? setEmployee(result.data) : setError(result.message); setLoading(false) }, [id])
  useEffect(() => { void load() }, [load])
  const changeStatus = async () => {
    if (!employee || (employee.superUser && employee.active)) return
    const active = !employee.active; const accepted = await confirm({ title: `${active ? 'Activate' : 'Deactivate'} Employee`, message: `${active ? 'Activate' : 'Deactivate'} ${employee.fullName}?`, confirmText: active ? 'Activate' : 'Deactivate', variant: active ? 'primary' : 'danger' })
    if (!accepted) return; setStatusLoading(true); const result = await employeeService.updateEmployeeStatus(employee.id, active); setStatusLoading(false)
    if (result.success) { setEmployee(result.data); toast.success(result.message) } else toast.error(result.message)
  }
  if (loading) return <div className="flex h-64 items-center justify-center"><Loader label="Loading employee details..." /></div>
  if (error || !employee) return <div className="py-12"><ErrorMessage message={error || 'Employee not found.'} onRetry={load} /></div>
  const info = [
    { icon: <Briefcase className="h-3.5 w-3.5" />, label: 'Designation', value: employee.designationName },
    { icon: <Mail className="h-3.5 w-3.5" />, label: 'Email Address', value: employee.email },
    { icon: <Phone className="h-3.5 w-3.5" />, label: 'Phone Number', value: employee.phoneNo },
    { icon: <User className="h-3.5 w-3.5" />, label: 'Gender', value: genderLabel(employee.gender) },
    { icon: <Calendar className="h-3.5 w-3.5" />, label: 'Join Date', value: formatDate(employee.joinDate) },
  ]
  return <div className="mx-auto flex max-w-5xl flex-col gap-6"><div><button onClick={() => navigate(ROUTES.EMPLOYEES)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"><ArrowLeft className="h-4 w-4" />Back to Employees</button><PageHeader title="Employee Details" actions={<div className="flex gap-2">{hasPrivilege(PRIV.EMPLOYEE_UPDATE) && <Button variant="outline" onClick={() => navigate(ROUTES.EMPLOYEE_EDIT.replace(':id', String(employee.id)))}>Edit</Button>}{hasPrivilege(PRIV.EMPLOYEE_STATUS_CHANGE) && <Button disabled={employee.superUser && employee.active} title={employee.superUser && employee.active ? 'The Super User cannot be deactivated' : undefined} variant={employee.active ? 'secondary' : 'primary'} isLoading={statusLoading} onClick={() => void changeStatus()}>{employee.active ? 'Deactivate' : 'Activate'}</Button>}</div>} /></div>
    <div className="grid gap-6 md:grid-cols-3"><Card className="flex flex-col items-center p-6 text-center">{employee.profileImage ? <img src={employee.profileImage} alt={employee.fullName} className="mb-4 h-32 w-32 rounded-full object-cover shadow-sm" /> : <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full text-4xl font-semibold text-white shadow-sm" style={{ backgroundColor: employee.avatarColor || '#12507F' }}>{initials(employee.fullName)}</div>}<div className="mb-2 flex flex-wrap justify-center gap-2"><h2 className="text-xl font-bold text-ink-900">{employee.fullName}</h2>{employee.superUser && <Badge tone="info">Super User</Badge>}</div><p className="mb-4 font-mono text-sm text-ink-500">{employee.employeeCode}</p><Badge tone={employee.active ? 'success' : 'neutral'} dot>{employee.active ? 'Active Employee' : 'Inactive Employee'}</Badge></Card>
      <Card className="overflow-hidden p-0 md:col-span-2"><div className="border-b border-ink-100 bg-ink-50/50 px-6 py-4"><h3 className="font-semibold text-ink-900">Profile Information</h3></div><div className="grid gap-6 p-6 sm:grid-cols-2">{info.map((item) => <div key={item.label}><span className="flex items-center gap-1.5 text-xs font-medium text-ink-500">{item.icon}{item.label}</span><span className="mt-1 block text-sm font-medium text-ink-900">{item.value || '—'}</span></div>)}</div>{(employee.createdAt || employee.updatedAt) && <div className="flex gap-8 border-t border-ink-100 bg-ink-50/50 px-6 py-4">{employee.createdAt && <div><p className="text-xs text-ink-500">Created At</p><p className="text-xs font-medium text-ink-700">{formatDateTime(employee.createdAt)}</p></div>}{employee.updatedAt && <div><p className="text-xs text-ink-500">Last Updated</p><p className="text-xs font-medium text-ink-700">{formatDateTime(employee.updatedAt)}</p></div>}</div>}</Card>
    </div></div>
}
