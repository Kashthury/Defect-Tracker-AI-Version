import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Page, PageSizeOption } from '@/types/common'
import { PAGE_SIZE_OPTIONS } from '@/constants/app'
import { cn } from '@/utils/cn'
import { formatNumber } from '@/utils/format'

interface PaginationProps<T> {
  page: Page<T> | null
  onPageChange: (pageNumber: number) => void
  onPageSizeChange: (pageSize: PageSizeOption) => void
}

export function Pagination<T>({ page, onPageChange, onPageSizeChange }: PaginationProps<T>) {
  if (!page) return null

  const { pageNumber, pageSize, totalElements, totalPages } = page
  const rangeStart = totalElements === 0 ? 0 : pageNumber * pageSize + 1
  const rangeEnd = Math.min(totalElements, (pageNumber + 1) * pageSize)
  const isFirst = pageNumber <= 0
  const isLast = pageNumber >= totalPages - 1

  const navBtn = 'inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 text-ink-500 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-200 disabled:hover:bg-transparent'

  return (
    <div className="flex flex-col gap-3 border-t border-ink-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <span>
          Showing <span className="font-semibold text-ink-800">{formatNumber(rangeStart)}{'\u2013'}{formatNumber(rangeEnd)}</span> of{' '}
          <span className="font-semibold text-ink-800">{formatNumber(totalElements)}</span> records
        </span>
        <span className="hidden text-ink-300 sm:inline">{'\u2022'}</span>
        <label className="hidden items-center gap-1.5 sm:flex">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSizeOption)}
            className="h-7 rounded-full border border-ink-200 bg-white px-2.5 text-xs text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1.5">
        <button className={navBtn} disabled={isFirst} onClick={() => onPageChange(0)} aria-label="First page">
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button className={navBtn} disabled={isFirst} onClick={() => onPageChange(pageNumber - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className={cn('rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-3 py-1 text-xs font-semibold text-white')}>
          Page {formatNumber(pageNumber + 1)} of {formatNumber(Math.max(totalPages, 1))}
        </span>
        <button className={navBtn} disabled={isLast} onClick={() => onPageChange(pageNumber + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button className={navBtn} disabled={isLast} onClick={() => onPageChange(totalPages - 1)} aria-label="Last page">
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
