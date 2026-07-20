import React from 'react'
import { ListFilter } from 'lucide-react'
import { SelectOption } from '@/types/common'

interface FilterProps {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

export const Filter: React.FC<FilterProps> = ({ label, value, options, onChange }) => {
  return (
    <div className="relative">
      <ListFilter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-md border border-ink-200 bg-white pl-8 pr-7 text-xs font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
      >
        <option value="All">{label}: All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
