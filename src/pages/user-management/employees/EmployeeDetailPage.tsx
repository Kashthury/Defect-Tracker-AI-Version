import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Briefcase, Calendar, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Loader } from '@/components/common/Loader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { employeeService } from '@/services/employeeService'
import { Employee } from '@/types/employee'
import { mockDesignations } from '@/mock/designations'
import { formatDate, formatDateTime, initials } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPrivilege } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadEmployee = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await employeeService.getEmployeeById(id)
      if (result.success) {
        setEmployee(result.data)
      } else {
        setError(result.message)
      }
    } catch (e) {
      setError('An unexpected error occurred while loading the employee details.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadEmployee()
  }, [loadEmployee])

  const handleStatusChange = async () => {
    if (!employee) return
    const newStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setIsUpdatingStatus(true)
    try {
       const result = await employeeService.updateEmployeeStatus(employee.id, newStatus)
       if (result.success) {
         setEmployee(result.data)
         toast.success(result.message)
       } else {
         toast.error(result.message)
       }
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!employee) return
    const ok = await confirm({
      title: 'Delete Employee',
      message: `Are you sure you want to delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete'
    })
    if (!ok) return
    
    setIsDeleting(true)
    try {
      const result = await employeeService.deleteEmployee(employee.id)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.EMPLOYEES)
      } else {
        toast.error(result.message)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader label="Loading employee details..." /></div>
  }

  if (error || !employee) {
    return <div className="py-12"><ErrorMessage message={error || 'Employee not found.'} /></div>
  }

  const designationName = mockDesignations.find((d) => d.id === employee.designationId)?.title ?? '\u2014'

  return (
    <div className="mx-auto max-w-5xl flex flex-col gap-6">
       <div>
        <button 
          onClick={() => navigate(ROUTES.EMPLOYEES)} 
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </button>
        <PageHeader
          title="Employee Details"
          actions={
            <div className="flex gap-2">
              {hasPrivilege(PRIV.EMPLOYEE_UPDATE) && (
                 <Button onClick={() => navigate(ROUTES.EMPLOYEE_EDIT.replace(':id', employee.id))} variant="outline">Edit</Button>
              )}
              {hasPrivilege(PRIV.EMPLOYEE_STATUS_CHANGE) && (
                 <Button 
                    onClick={handleStatusChange} 
                    variant={employee.status === 'ACTIVE' ? 'secondary' : 'primary'}
                    isLoading={isUpdatingStatus}
                 >
                    {employee.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                 </Button>
              )}
              {hasPrivilege(PRIV.EMPLOYEE_DELETE) && (
                 <Button onClick={handleDelete} variant="danger" isLoading={isDeleting}>Delete</Button>
              )}
            </div>
          }
        />
       </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-1 flex flex-col items-center text-center">
            {employee.profileImage ? (
                <img src={employee.profileImage} alt={`${employee.firstName} ${employee.lastName}`} className="h-32 w-32 rounded-full object-cover shadow-sm mb-4" />
            ) : (
                <div 
                    className="flex h-32 w-32 items-center justify-center rounded-full text-4xl font-semibold text-white shadow-sm mb-4" 
                    style={{ backgroundColor: employee.avatarColor }}
                >
                    {initials(`${employee.firstName} ${employee.lastName}`)}
                </div>
            )}
            <h2 className="text-xl font-bold text-ink-900 mb-1">{employee.firstName} {employee.lastName}</h2>
            <p className="text-sm text-ink-500 mb-4">{employee.id}</p>
            <Badge tone={employee.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
                {employee.status === 'ACTIVE' ? 'Active Employee' : 'Inactive Employee'}
            </Badge>
        </Card>

        <Card className="p-0 md:col-span-2 overflow-hidden">
            <div className="border-b border-ink-100 bg-ink-50/50 px-6 py-4">
                <h3 className="text-base font-semibold text-ink-900">Profile Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 p-6">
                
                <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
                        <Briefcase className="h-3.5 w-3.5" /> Designation
                    </span>
                    <span className="text-sm font-medium text-ink-900">{designationName}</span>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
                        <Mail className="h-3.5 w-3.5" /> Email Address
                    </span>
                    <span className="text-sm font-medium text-ink-900">{employee.email}</span>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
                        <Phone className="h-3.5 w-3.5" /> Phone Number
                    </span>
                    <span className="text-sm font-medium text-ink-900">{employee.phone}</span>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
                        <User className="h-3.5 w-3.5" /> Gender
                    </span>
                    <span className="text-sm font-medium text-ink-900">{employee.gender}</span>
                </div>

                 <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
                        <Calendar className="h-3.5 w-3.5" /> Join Date
                    </span>
                    <span className="text-sm font-medium text-ink-900">{formatDate(employee.joinDate)}</span>
                </div>
            </div>

            <div className="border-t border-ink-100 bg-ink-50/50 px-6 py-4 flex flex-col sm:flex-row gap-4 sm:gap-8">
                 <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-ink-500">Created At</span>
                    <span className="text-xs font-medium text-ink-700">{formatDateTime(employee.createdAt)}</span>
                </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-ink-500">Last Updated</span>
                    <span className="text-xs font-medium text-ink-700">{formatDateTime(employee.updatedAt)}</span>
                </div>
            </div>
        </Card>
      </div>
    </div>
  )
}
