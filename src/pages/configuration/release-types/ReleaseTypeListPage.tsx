import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Plus, Search as SearchIcon, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableColumn } from '@/components/common/Table'
import { Pagination } from '@/components/common/Pagination'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { usePagination } from '@/hooks/usePagination'
import { releaseTypeService } from '@/services/releaseTypeService'
import { ReleaseTypeConfig } from '@/types/defect'
import { formatDate } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'

export const ReleaseTypeListPage: React.FC = () => {
  const navigate = useNavigate()
  const { hasPrivilege } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const [searchText, setSearchText] = useState('')

  const fetcher = useCallback(
    (req: Parameters<typeof releaseTypeService.getReleaseTypes>[0]) =>
      releaseTypeService.getReleaseTypes(req),
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
  } = usePagination<ReleaseTypeConfig>({ fetcher, initialPageSize: 10, initialSortBy: 'name' })

  const handleSearch = () => setSearch(searchText)

  const handleClear = () => {
    setSearchText('')
    setSearch('')
  }

  const handleDelete = async (releaseType: ReleaseTypeConfig) => {
    const confirmed = await confirm({
      title: 'Delete Release Type',
      message: `Are you sure you want to delete ${releaseType.name}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
    })
    if (!confirmed) return

    const result = await releaseTypeService.deleteReleaseType(releaseType.id)
    if (result.success) {
      toast.success(result.message)
      reload()
    } else {
      toast.error(result.message)
    }
  }

  const columns: TableColumn<ReleaseTypeConfig>[] = [
    {
      key: 'name',
      header: 'Release Type Name',
      sortable: true,
      render: (t) => <span className="font-medium text-ink-900">{t.name}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (t) => <span className="text-ink-500">{t.description || 'No description'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      align: 'right',
      render: (t) => <span className="text-ink-600">{formatDate(t.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (t) => (
        <div className="flex items-center justify-center gap-1">
          {hasPrivilege(PRIV.RELEASE_TYPE_UPDATE) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                navigate(ROUTES.RELEASE_TYPE_EDIT.replace(':id', t.id))
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-brand-600"
              title="Edit release type"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {hasPrivilege(PRIV.RELEASE_TYPE_DELETE) && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleDelete(t)
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-signal-critical"
              title="Delete release type"
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
        title="Release Type"
        description="Categories used to classify releases (major, minor, patch, hotfix)."
        actions={
          hasPrivilege(PRIV.RELEASE_TYPE_CREATE) ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(ROUTES.RELEASE_TYPE_CREATE)}>
              Create Release Type
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
            placeholder="Search by release type name..."
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
          rowKey={(t) => t.id}
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={(key) => {
            if (key === 'actions' || key === 'description') return
            if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
            else {
              setSortBy(key)
              setSortDir('asc')
            }
          }}
          onRowClick={
            hasPrivilege(PRIV.RELEASE_TYPE_UPDATE)
              ? (t) => navigate(ROUTES.RELEASE_TYPE_EDIT.replace(':id', t.id))
              : undefined
          }
          emptyTitle="No release types found"
          emptyDescription="Try adjusting your search term."
        />
        <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
      </div>
    </div>
  )
}
