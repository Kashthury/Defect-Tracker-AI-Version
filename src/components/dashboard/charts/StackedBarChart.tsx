import React from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface StackedSeries {
  key: string
  color: string
}

interface StackedBarChartProps {
  data: Record<string, string | number>[]
  categoryKey: string
  series: StackedSeries[]
  height?: number
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({ data, categoryKey, series, height = 300 }) => {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F6" />
          <XAxis dataKey={categoryKey} tick={{ fontSize: 11, fill: '#26314A' }} />
          <YAxis tick={{ fontSize: 11, fill: '#586582' }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #DCE1EA', fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} stackId="stack" fill={s.color} maxBarSize={46} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
