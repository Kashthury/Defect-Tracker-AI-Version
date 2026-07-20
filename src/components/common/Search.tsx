import React, { useEffect, useState } from 'react'
import { Search as SearchIcon, X } from 'lucide-react'

interface SearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
}

export const Search: React.FC<SearchProps> = ({ value, onChange, placeholder = 'Search...', debounceMs = 300 }) => {
  const [local, setLocal] = useState(value)

  useEffect(() => setLocal(value), [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local)
    }, debounceMs)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local])

  return (
    <div className="relative w-full sm:w-72">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-ink-200 bg-white pl-9 pr-8 text-sm text-ink-900 placeholder:text-ink-400 transition-all focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
      />
      {local && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setLocal('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
