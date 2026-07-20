import React, { useCallback, useState } from 'react'
import { ArrowLeft, Eye, Search as SearchIcon, ShieldCheck, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableColumn } from '@/components/common/Table'
import { Pagination } from '@/components/common/Pagination'
import { Input } from '@/components/common/Input'
import { Filter } from '@/components/common/Filter'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { usePagination } from '@/hooks/usePagination'
import { privilegeService } from '@/services/privilegeService'
import { PrivilegeDefinition } from '@/types/privilege'
import { PRIVILEGE_MODULES } from '@/mock/privilegeCatalog'
import { ROUTES } from '@/constants/routes'

const MODULE_OPTIONS = PRIVILEGE_MODULES.map((m) => ({ label: m, value: m }))

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

const statusLabel = (status: PrivilegeDefinition['status']) => (status === 'ACTIVE' ? 'Active' : 'Inactive')

export const PrivilegeListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [module, setModule] = useState('All')
  const [status, setStatus] = useState('All')
  const [selected, setSelected] = useState<PrivilegeDefinition | null>(null)

  const fetcher = useCallback(
    (req: Parameters<typeof privilegeService.getPrivileges>[0]) => privilegeService.getPrivileges(req),
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
  } = usePagination<PrivilegeDefinition>({
    fetcher,
    initialPageSize: 10,
    initialSortBy: 'module',
    filters: { module, status },
  })

  const handleSearch = () => setSearch(searchText)

  const handleClearFilters = () => {
    setSearchText('')
    setSearch('')
    setModule('All')
    setStatus('All')
  }

  const columns: TableColumn<PrivilegeDefinition>[] = [
    {
      key: 'name',
      header: 'Privilege Name',
      sortable: true,
      render: (p) => <span className="font-medium text-ink-900">{p.name}</span>,
    },
    {
      key: 'code',
      header: 'Privilege Code',
      sortable: true,
      render: (p) => <span className="font-mono text-xs font-semibold text-brand-600">{p.code}</span>,
    },
    {
      key: 'module',
      header: 'Module',
      sortable: true,
      render: (p) => <Badge tone="neutral">{p.module}</Badge>,
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (p) => <span className="text-ink-700">{p.action}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (p) => <span className="text-ink-500">{p.description}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (p) => (
        <Badge tone={p.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
          {statusLabel(p.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (p) => (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setSelected(p)
            }}
            className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            title="View privilege"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={() => navigate(ROUTES.PRIVILEGE)} className="flex w-fit items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> Back to Privilege</button>
      <PageHeader
        title="Privilege List"
        description="System-controlled catalogue of the smallest permission units. Privileges cannot be created, edited, or deleted."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-80">
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSearch()
              }}
              placeholder="Search by privilege name or code..."
              leftIcon={<SearchIcon className="h-4 w-4" />}
            />
          </div>
          <Button variant="secondary" onClick={handleSearch} leftIcon={<SearchIcon className="h-4 w-4" />}>
            Search
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter label="Module" value={module} options={MODULE_OPTIONS} onChange={setModule} />
          <Filter label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          <Button
            variant="filterClear"
            size="sm"
            onClick={handleClearFilters}
            leftIcon={<X className="h-4 w-4" />}
            disabled={!search && !searchText && module === 'All' && status === 'All'}
          >
            Clear Filters
          </Button>
        </div>
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
            if (key === 'actions') return
            if (sortBy === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
            else {
              setSortBy(key)
              setSortDir('asc')
            }
          }}
          onRowClick={(p) => setSelected(p)}
          emptyTitle="No privileges found"
          emptyDescription="Try adjusting your search term or filters."
        />
        <Pagination page={page} onPageChange={setPageNumber} onPageSizeChange={setPageSize} />
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Privilege Details"
        description="Read-only view. Privileges are defined at the system level."
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {selected && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-500/10 text-brand-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink-900">{selected.name}</h3>
                <span className="font-mono text-xs font-semibold text-brand-600">{selected.code}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailField label="Module">
                <Badge tone="neutral">{selected.module}</Badge>
              </DetailField>
              <DetailField label="Action">
                <span className="text-sm font-medium text-ink-900">{selected.action}</span>
              </DetailField>
              <DetailField label="Status">
                <Badge tone={selected.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
                  {statusLabel(selected.status)}
                </Badge>
              </DetailField>
            </div>
            <DetailField label="Description">
              <p className="text-sm text-ink-700">{selected.description}</p>
            </DetailField>
          </div>
        )}
      </Modal>
    </div>
  )
}

const DetailField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</span>
    {children}
  </div>
)
