import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Plus, Search as SearchIcon, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableColumn } from '@/components/common/Table'
import { Pagination } from '@/components/common/Pagination'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { usePagination } from '@/hooks/usePagination'
import { severityService } from '@/services/severityService'
import { SeverityConfig } from '@/types/defect'
import { formatDate, formatNumber } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'

export const SeverityListPage: React.FC = () => {
  const navigate = useNavigate()
  const { hasPrivilege } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [searchText, setSearchText] = useState('')

  const fetcher = useCallback(
    (req: Parameters<typeof severityService.getSeverities>[0]) => severityService.getSeverities(req),
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
  } = usePagination<SeverityConfig>({ fetcher, initialPageSize: 10, initialSortBy: 'weight', initialSortDir: 'desc' })

  const handleSearch = () => setSearch(searchText)

  const handleClear = () => {
    setSearchText('')
    setSearch('')
  }

  const handleDelete = async (severity: SeverityConfig) => {
    const confirmed = await confirm({
      title: 'Delete Severity',
      message: `Are you sure you want to delete ${severity.name}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
    })
    if (!confirmed) return

    const result = await severityService.deleteSeverity(severity.id)
    if (result.success) {
      toast.success(result.message)
      reload()
    } else {
      toast.error(result.message)
    }
  }

  const columns: TableColumn<SeverityConfig>[] = [
    {
      key: 'name',
      header: 'Severity Name',
      sortable: true,
      render: (severity) => (
        <div className="flex items-center gap-2.5">
          <span
            className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
            style={{ backgroundColor: severity.color }}
          />
          <span className="font-medium text-ink-900">{severity.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (severity) => <span className="text-ink-500">{severity.description || 'No description'}</span>,
    },
    {
      key: 'weight',
      header: 'Weight',
      sortable: true,
      align: 'right',
      render: (severity) => <span className="font-medium text-ink-900">{formatNumber(severity.weight)}</span>,
    },
    {
      key: 'color',
      header: 'Color',
      render: (severity) => <span className="font-mono text-xs uppercase text-ink-600">{severity.color}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      align: 'right',
      render: (severity) => <span className="text-ink-600">{formatDate(severity.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (severity) => (
        <div className="flex items-center justify-center gap-1">
          {hasPrivilege(PRIV.SEVERITY_UPDATE) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                navigate(ROUTES.SEVERITY_EDIT.replace(':id', severity.id))
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-brand-600"
              title="Edit severity"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {hasPrivilege(PRIV.SEVERITY_DELETE) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleDelete(severity)
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-signal-critical"
              title="Delete severity"
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
        title="Severity"
        description="Severity levels used to indicate defect impact and calculate the dashboard severity defect index."
        actions={
          hasPrivilege(PRIV.SEVERITY_CREATE) ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(ROUTES.SEVERITY_CREATE)}>
              Create Severity
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
            placeholder="Search by severity name..."
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
          rowKey={(severity) => severity.id}
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
            hasPrivilege(PRIV.SEVERITY_UPDATE)
              ? (severity) => navigate(ROUTES.SEVERITY_EDIT.replace(':id', severity.id))
              : undefined
          }
          emptyTitle="No severities found"
          emptyDescription="Try adjusting your search term."
        />
        <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
      </div>
    </div>
  )
}
