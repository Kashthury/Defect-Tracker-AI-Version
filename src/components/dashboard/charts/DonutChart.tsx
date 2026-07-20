import React from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export interface DonutSlice {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutSlice[]
  height?: number
  innerRadius?: number
  centerLabel?: string
  centerValue?: string
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, height = 260, innerRadius = 62, centerLabel, centerValue }) => {
  return (
    <div className="relative w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={innerRadius + 32} paddingAngle={2}>
            {data.map((slice, i) => (
              <Cell key={i} fill={slice.color} stroke="#fff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value}`, name]}
            contentStyle={{ borderRadius: 8, border: '1px solid #DCE1EA', fontSize: 12 }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: 36 }}>
          <span className="text-2xl font-bold text-ink-900">{centerValue}</span>
          {centerLabel && <span className="text-[11px] text-ink-500">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}
