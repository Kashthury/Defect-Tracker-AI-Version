import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Plus, Search as SearchIcon, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableColumn } from '@/components/common/Table'
import { Pagination } from '@/components/common/Pagination'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { usePagination } from '@/hooks/usePagination'
import { designationService } from '@/services/designationService'
import { Designation } from '@/types/auth'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'

export const DesignationListPage: React.FC = () => {
  const navigate = useNavigate()
  const { hasPrivilege } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [searchText, setSearchText] = useState('')

  const fetcher = useCallback(
    (req: Parameters<typeof designationService.getDesignations>[0]) =>
      designationService.getDesignations(req),
    [],
  )
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
    reload,
  } = usePagination<Designation>({ fetcher, initialPageSize: 10, initialSortBy: 'title' })

  const handleSearch = () => setSearch(searchText)

  const handleClearFilters = () => {
    setSearchText('')
    setSearch('')
  }

  const handleDelete = async (designation: Designation) => {
    const confirmed = await confirm({
      title: 'Delete Designation',
      message: `Are you sure you want to delete ${designation.title}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
    })
    if (!confirmed) return

    const result = await designationService.deleteDesignation(designation.id)
    if (result.success) {
      toast.success(result.message)
      reload()
    } else {
      toast.error(result.message)
    }
  }

  const columns: TableColumn<Designation>[] = [
    {
      key: 'title',
      header: 'Designation Name',
      sortable: true,
      render: (d) => <span className="font-medium text-ink-900">{d.title}</span>,
    },
    {
      key: 'headcount',
      header: 'Employees',
      align: 'right',
      render: (d) => <span className="text-ink-600">{d.employeeCount ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (d) => (
        <div className="flex items-center justify-center gap-1">
          {hasPrivilege(PRIV.DESIGNATION_UPDATE) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                navigate(ROUTES.DESIGNATION_EDIT.replace(':id', d.id))
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-brand-600"
              title="Edit designation"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {hasPrivilege(PRIV.DESIGNATION_DELETE) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleDelete(d)
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-signal-critical"
              title="Delete designation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Designations"
        description="Job titles assignable to employee records."
        actions={
          hasPrivilege(PRIV.DESIGNATION_CREATE) ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(ROUTES.DESIGNATION_CREATE)}>
              Create Designation
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="w-full sm:w-80">
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSearch()
            }}
            placeholder="Search by designation name..."
            leftIcon={<SearchIcon className="h-4 w-4" />}
          />
        </div>
        <Button variant="secondary" onClick={handleSearch} leftIcon={<SearchIcon className="h-4 w-4" />}>
          Search
        </Button>
        <Button
          variant="ghost"
          onClick={handleClearFilters}
          leftIcon={<X className="h-4 w-4" />}
          disabled={!search && !searchText}
        >
          Clear
        </Button>
      </div>

      <div>
        <Table
          columns={columns}
          rows={page?.content ?? []}
          rowKey={(d) => d.id}
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={(key) => {
            if (key === 'actions' || key === 'headcount') return
            if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
            else {
              setSortBy(key)
              setSortDir('asc')
            }
          }}
          onRowClick={
            hasPrivilege(PRIV.DESIGNATION_UPDATE)
              ? (d) => navigate(ROUTES.DESIGNATION_EDIT.replace(':id', d.id))
              : undefined
          }
          emptyTitle="No designations found"
          emptyDescription="Try adjusting your search term."
        />
        <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
      </div>
    </div>
  )
}
