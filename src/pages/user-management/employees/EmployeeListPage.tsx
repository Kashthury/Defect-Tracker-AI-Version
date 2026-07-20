import React, { useCallback } from 'react'
import { Plus, UserCog, User, Trash2, Edit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableColumn } from '@/components/common/Table'
import { Pagination } from '@/components/common/Pagination'
import { Search } from '@/components/common/Search'
import { Filter } from '@/components/common/Filter'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Dropdown } from '@/components/common/Dropdown'
import { usePagination } from '@/hooks/usePagination'
import { employeeService } from '@/services/employeeService'
import { Employee, EmployeeStatus } from '@/types/employee'
import { mockDesignations } from '@/mock/designations'
import { formatDate, initials } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'

export const EmployeeListPage: React.FC = () => {
  const { hasPrivilege } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const fetcher = useCallback((req: Parameters<typeof employeeService.getEmployees>[0]) => employeeService.getEmployees(req), [])
  
  const { 
    page, 
    isLoading, 
    error, 
    search, 
    sortBy, 
    sortDir, 
    setPageNumber, 
    setPageSize, 
    setSearch, 
    setSortBy, 
    setSortDir, 
    reload 
  } = usePagination<Employee>({ fetcher, initialPageSize: 10 })

  const designationName = (id: string) => mockDesignations.find((d) => d.id === id)?.title ?? '\u2014'

  const columns: TableColumn<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          {r.profileImage ? (
            <img src={r.profileImage} alt={`${r.firstName} ${r.lastName}`} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: r.avatarColor }}>
              {initials(`${r.firstName} ${r.lastName}`)}
            </span>
          )}
          <div>
            <p className="font-medium text-ink-900">{r.firstName} {r.lastName}</p>
            <p className="text-xs text-ink-500">{r.id}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', sortable: true, render: (r) => <span className="text-ink-600">{r.email}</span> },
    { key: 'designationId', header: 'Designation', render: (r) => <span className="text-ink-600">{designationName(r.designationId)}</span> },
    { key: 'phone', header: 'Phone Number', sortable: true, render: (r) => <span className="text-ink-600">{r.phone}</span> },
    { 
      key: 'status', 
      header: 'Status', 
      sortable: true, 
      render: (r) => <Badge tone={r.status === 'ACTIVE' ? 'success' : 'neutral'} dot>{r.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge> 
    },
    { key: 'joinDate', header: 'Joined', sortable: true, render: (r) => <span className="text-ink-600">{formatDate(r.joinDate)}</span>, align: 'right' },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (r) => (
         <div className="flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {hasPrivilege(PRIV.EMPLOYEE_VIEW) && (
              <button onClick={(e) => { e.stopPropagation(); navigate(ROUTES.EMPLOYEE_DETAIL.replace(':id', r.id)); }} className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700" title="View details">
                <User className="h-4 w-4" />
              </button>
            )}
             {hasPrivilege(PRIV.EMPLOYEE_UPDATE) && (
              <button onClick={(e) => { e.stopPropagation(); navigate(ROUTES.EMPLOYEE_EDIT.replace(':id', r.id)); }} className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-brand-600" title="Edit employee">
                <Edit className="h-4 w-4" />
              </button>
            )}
            {hasPrivilege(PRIV.EMPLOYEE_STATUS_CHANGE) && (
              <button 
                onClick={async (e) => { 
                  e.stopPropagation(); 
                  const newStatus = r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                  const result = await employeeService.updateEmployeeStatus(r.id, newStatus);
                  if (result.success) {
                    toast.success(result.message);
                    reload();
                  } else {
                    toast.error(result.message);
                  }
                }} 
                className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-amber-600" title="Toggle status"
              >
                <UserCog className="h-4 w-4" />
              </button>
            )}
             {hasPrivilege(PRIV.EMPLOYEE_DELETE) && (
              <button onClick={async (e) => { 
                e.stopPropagation(); 
                const ok = await confirm({
                  title: 'Delete Employee',
                  message: `Are you sure you want to delete ${r.firstName} ${r.lastName}? This action cannot be undone.`,
                  variant: 'danger',
                  confirmText: 'Delete'
                });
                if (ok) {
                   const result = await employeeService.deleteEmployee(r.id);
                   if (result.success) {
                     toast.success(result.message);
                     reload();
                   } else {
                     toast.error(result.message);
                   }
                }
              }} className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-signal-critical" title="Delete employee">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
         </div>
      ),
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employees"
        description="Manage system employees, their roles, and privileges."
        actions={
          hasPrivilege(PRIV.EMPLOYEE_CREATE) ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(ROUTES.EMPLOYEE_CREATE)}>
              Add Employee
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <Search value={search} onChange={setSearch} placeholder="Search by name, email, or phone..." />
        </div>
      </div>

      <div className="group rounded-lg border border-ink-100 bg-white shadow-panel">
        <Table
          columns={columns}
          rows={page?.content ?? []}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={(key) => {
            if (key === 'actions') return;
            if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
            else {
              setSortBy(key)
              setSortDir('asc')
            }
          }}
          onRowClick={hasPrivilege(PRIV.EMPLOYEE_VIEW) ? ((r) => navigate(ROUTES.EMPLOYEE_DETAIL.replace(':id', r.id))) : undefined}
          emptyTitle="No employees found"
          emptyDescription="Try adjusting your search or filters."
        />
        <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
      </div>
    </div>
  )
}
