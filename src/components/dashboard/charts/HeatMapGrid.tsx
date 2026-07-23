import React from 'react'
import { RISK_COLORS, RISK_SOFT_COLORS, RiskLevel } from '@/config/riskThresholds'
import { ModuleRiskCell } from '@/types/dashboard'

interface HeatMapGridProps {
  modules: string[]
  severities: string[]
  cells: ModuleRiskCell[]
}

export const HeatMapGrid: React.FC<HeatMapGridProps> = ({ modules, severities, cells }) => {
  const cellFor = (moduleName: string, severity: string) =>
    cells.find((c) => c.moduleName === moduleName && c.severity === severity)

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[480px] border-separate" style={{ borderSpacing: 6 }}>
        <thead>
          <tr>
            <th className="w-32 text-left text-xs font-semibold text-ink-500">Module</th>
            {severities.map((sev) => (
              <th key={sev} className="text-center text-xs font-semibold text-ink-500">{sev}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modules.map((moduleName) => (
            <tr key={moduleName}>
              <td className="truncate pr-2 text-xs font-medium text-ink-700">{moduleName}</td>
              {severities.map((severity) => {
                const cell = cellFor(moduleName, severity)
                const risk: RiskLevel = cell?.risk ?? 'LOW'
                return (
                  <td key={severity} className="p-0 text-center">
                    <div
                      title={`${moduleName} \u00b7 ${severity}: ${cell?.count ?? 0} defects (${risk.toLowerCase()} risk)${cell?.weightedScore == null ? '' : ` \u00b7 weighted score ${cell.weightedScore}`}`}
                      className="flex h-11 items-center justify-center rounded-md text-sm font-semibold transition-transform hover:scale-105"
                      style={{ backgroundColor: cell && cell.count > 0 ? RISK_COLORS[risk] : RISK_SOFT_COLORS.LOW, color: cell && cell.count > 0 ? '#fff' : '#8B96AC' }}
                    >
                      {cell?.count ?? 0}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-ink-500">
        <span className="font-medium text-ink-600">Legend:</span>
        {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as RiskLevel[]).map((risk) => (
          <span key={risk} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: RISK_COLORS[risk] }} />
            {risk.charAt(0) + risk.slice(1).toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  )
}
