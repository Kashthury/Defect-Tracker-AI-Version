import React from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface LineSeries<T> {
  key: keyof T & string
  color: string
  label: string
}

interface TrendLineChartProps<T> {
  data: T[]
  categoryKey: keyof T & string
  series: LineSeries<T>[]
  height?: number
}

export function TrendLineChart<T extends object>({ data, categoryKey, series, height = 280 }: TrendLineChartProps<T>) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F6" />
          <XAxis dataKey={categoryKey} tick={{ fontSize: 11, fill: '#26314A' }} />
          <YAxis tick={{ fontSize: 11, fill: '#586582' }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #DCE1EA', fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
