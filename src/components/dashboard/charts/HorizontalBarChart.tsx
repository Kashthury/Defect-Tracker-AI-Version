import React from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface HorizontalBarDatum {
  label: string
  value: number
}

interface HorizontalBarChartProps {
  data: HorizontalBarDatum[]
  height?: number
  color?: string
  colorForValue?: (value: number, index: number) => string
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({ data, height = 300, color = '#2E8FC9', colorForValue }) => {
  const rowHeight = 32
  const chartHeight = Math.max(height, data.length * rowHeight + 40)
  return (
    <div style={{ height: chartHeight }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF1F6" />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#586582' }} allowDecimals={false} />
          <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11, fill: '#26314A' }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #DCE1EA', fontSize: 12 }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((d, i) => (
              <Cell key={i} fill={colorForValue ? colorForValue(d.value, i) : color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
