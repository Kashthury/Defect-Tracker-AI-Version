import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Plus, Search as SearchIcon, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableColumn } from '@/components/common/Table'
import { Pagination } from '@/components/common/Pagination'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { usePagination } from '@/hooks/usePagination'
import { priorityService } from '@/services/priorityService'
import { PriorityConfig } from '@/types/defect'
import { formatDate } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'

export const PriorityListPage: React.FC = () => {
  const navigate = useNavigate()
  const { hasPrivilege } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [searchText, setSearchText] = useState('')

  const fetcher = useCallback(
    (req: Parameters<typeof priorityService.getPriorities>[0]) => priorityService.getPriorities(req),
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
  } = usePagination<PriorityConfig>({ fetcher, initialPageSize: 10, initialSortBy: 'name' })

  const handleSearch = () => setSearch(searchText)

  const handleClear = () => {
    setSearchText('')
    setSearch('')
  }

  const handleDelete = async (priority: PriorityConfig) => {
    const confirmed = await confirm({
      title: 'Delete Priority',
      message: `Are you sure you want to delete ${priority.name}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
    })
    if (!confirmed) return

    const result = await priorityService.deletePriority(priority.id)
    if (result.success) {
      toast.success(result.message)
      reload()
    } else {
      toast.error(result.message)
    }
  }

  const columns: TableColumn<PriorityConfig>[] = [
    {
      key: 'name',
      header: 'Priority Name',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <span
            className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
            style={{ backgroundColor: p.color }}
          />
          <span className="font-medium text-ink-900">{p.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (p) => <span className="text-ink-500">{p.description || 'No description'}</span>,
    },
    {
      key: 'color',
      header: 'Color',
      render: (p) => <span className="font-mono text-xs uppercase text-ink-600">{p.color}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      align: 'right',
      render: (p) => <span className="text-ink-600">{formatDate(p.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (p) => (
        <div className="flex items-center justify-center gap-1">
          {hasPrivilege(PRIV.PRIORITY_UPDATE) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                navigate(ROUTES.PRIORITY_EDIT.replace(':id', p.id))
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-brand-600"
              title="Edit priority"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {hasPrivilege(PRIV.PRIORITY_DELETE) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleDelete(p)
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-signal-critical"
              title="Delete priority"
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
        title="Priority"
        description="Priority levels used to indicate fix urgency."
        actions={
          hasPrivilege(PRIV.PRIORITY_CREATE) ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(ROUTES.PRIORITY_CREATE)}>
              Create Priority
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
            placeholder="Search by priority name..."
            leftIcon={<SearchIcon className="h-4 w-4" />}
          />
        </div>
        <Button variant="secondary" onClick={handleSearch} leftIcon={<SearchIcon className="h-4 w-4" />}>
          Search
        </Button>
        <Button
          variant="ghost"
          onClick={handleClear}
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
          rowKey={(p) => p.id}
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={(key) => {
            if (key === 'actions' || key === 'description' || key === 'color') return
            if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
            else {
              setSortBy(key)
              setSortDir('asc')
            }
          }}
          onRowClick={
            hasPrivilege(PRIV.PRIORITY_UPDATE)
              ? (p) => navigate(ROUTES.PRIORITY_EDIT.replace(':id', p.id))
              : undefined
          }
          emptyTitle="No priorities found"
          emptyDescription="Try adjusting your search term."
        />
        <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
      </div>
    </div>
  )
}
