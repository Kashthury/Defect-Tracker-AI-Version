import React from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Loader } from './Loader'
import { EmptyState } from './EmptyState'
import { ErrorMessage } from './ErrorMessage'

export interface TableColumn<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'right' | 'center'
  sticky?: 'left' | 'left-second'
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  isLoading?: boolean
  error?: string | null
  emptyTitle?: string
  emptyDescription?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  onRetry?: () => void
  onRowClick?: (row: T) => void
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  error,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters.',
  sortBy,
  sortDir,
  onSort,
  onRetry,
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-panel">
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[720px] table-sticky-header text-left text-sm">
          <thead className="text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width, minWidth: col.width, maxWidth: col.width } : undefined}
                  className={cn(
                    'group border-b border-brand-700 bg-brand-600 px-4 py-3 whitespace-nowrap',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.sortable && 'cursor-pointer select-none hover:text-white',
                    col.sticky === 'left' && 'sticky left-0 z-20 bg-brand-600 sticky-col-header',
                    col.sticky === 'left-second' && 'sticky left-[120px] z-20 bg-brand-600 sticky-col-header',
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable &&
                      (sortBy === col.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!isLoading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            )}
            {!isLoading &&
              !error &&
              rows.map((row, index) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'group border-b border-ink-50 last:border-0 transition-colors hover:bg-brand-50/50',
                    index % 2 === 1 && 'bg-ink-50/40',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={col.width ? { width: col.width, minWidth: col.width, maxWidth: col.width } : undefined}
                      className={cn(
                        'px-4 py-3 text-ink-700 align-middle',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.sticky === 'left' && 'sticky left-0 z-10 bg-white group-hover:bg-brand-50/50',
                        col.sticky === 'left-second' && 'sticky left-[120px] z-10 bg-white group-hover:bg-brand-50/50',
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader label={'Loading records\u2026'} />
          </div>
        )}
        {!isLoading && error && (
          <div className="py-12">
            <ErrorMessage message={error} onRetry={onRetry} />
          </div>
        )}
      </div>
    </div>
  )
}
