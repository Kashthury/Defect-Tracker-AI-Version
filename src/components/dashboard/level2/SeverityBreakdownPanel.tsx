import React, { useEffect, useState } from 'react'
import { Loader } from '@/components/common/Loader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { severityAnalyticsService } from '@/services/dashboard/severityAnalyticsService'
import { SeverityBreakdownData } from '@/types/dashboard'
import { formatNumber } from '@/utils/format'

interface SeverityBreakdownPanelProps {
  projectId: string
  refreshToken: number
}

/**
 * Compact severity x status matrix — one row per severity (highest weight
 * first) so the whole breakdown fits in a medium-height card instead of a
 * tall stack of expandable panels.
 */
export const SeverityBreakdownPanel: React.FC<SeverityBreakdownPanelProps> = ({ projectId, refreshToken }) => {
  const [data, setData] = useState<SeverityBreakdownData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)
    severityAnalyticsService
      .getSeverityBreakdown(projectId)
      .then((result) => {
        if (!active) return
        if (result.success) setData(result.data)
        else setError(result.message)
        setIsLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError('Unable to load severity breakdown.')
        setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [projectId, refreshToken])

  const statusLabels = data?.groups[0]?.statusCounts ?? []

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">Defect Severity Breakdown</h3>
          <p className="mt-0.5 text-xs text-ink-500">Grouped by severity, ordered from highest to lowest weight</p>
        </div>
        {data && (
          <div className="flex gap-4 text-xs text-ink-500">
            <span><strong className="text-ink-900">{formatNumber(data.totalReportedRemarks)}</strong> Total Remarks</span>
            <span><strong className="text-ink-900">{formatNumber(data.totalConfirmedDefects)}</strong> Confirmed Defects</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader label="Loading severity breakdown..." /></div>
      ) : error || !data ? (
        <ErrorMessage message={error ?? 'Severity breakdown unavailable.'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate" style={{ borderSpacing: '0 6px' }}>
            <thead>
              <tr>
                <th className="w-36 px-2 pb-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">Severity</th>
                <th className="w-16 px-2 pb-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-400">Total</th>
                {statusLabels.map((status) => (
                  <th key={status.status} className="px-2 pb-1.5 text-center text-[11px] font-semibold uppercase tracking-wide">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 normal-case tracking-normal" style={{ backgroundColor: `${status.color}18`, color: status.color, boxShadow: `inset 0 0 0 1px ${status.color}35` }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />{status.status}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.groups.map((group) => (
                <tr key={group.severity} className="h-10 bg-ink-50/60">
                  <td className="rounded-l-lg px-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
                      <span className="truncate text-xs font-semibold text-ink-900">{group.severity}</span>
                      <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-ink-500 ring-1 ring-inset ring-ink-200">
                        w{group.weight}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 text-center text-sm font-bold text-ink-900">{group.totalDefects}</td>
                  {group.statusCounts.map((status) => (
                    <td key={status.status} className="px-2 text-center text-xs font-medium last:rounded-r-lg">
                      <span className="inline-flex min-w-7 justify-center rounded-md px-2 py-1" style={status.count > 0 ? { backgroundColor: `${status.color}16`, color: status.color } : undefined}>
                        {status.count > 0 ? status.count : <span className="text-ink-300">0</span>}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
