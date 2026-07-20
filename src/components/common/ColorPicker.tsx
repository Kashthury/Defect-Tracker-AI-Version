import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ColorPickerProps {
  label?: string
  value: string
  onChange: (hex: string) => void
  error?: string
  required?: boolean
  hint?: string
  presets?: string[]
}

/** Default palette drawn from the app's signal/brand tones. */
export const DEFAULT_COLOR_PRESETS = [
  '#C13B3B', // critical red
  '#D97A3F', // high orange
  '#C99A2E', // medium amber
  '#3E8E64', // low green
  '#3E6FBF', // info blue
  '#12507F', // brand
  '#6B4FA0', // purple
  '#586582', // slate
]

const normalizeHex = (value: string) => {
  const v = value.trim()
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : value
}

/**
 * Color selection control matching the app's form styling. Offers preset
 * swatches plus a native color input and a hex text field, all kept in sync.
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  error,
  required,
  hint,
  presets = DEFAULT_COLOR_PRESETS,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-ink-700">
          {label}
          {required && <span className="text-signal-critical ml-0.5">*</span>}
        </label>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => {
          const selected = value.toUpperCase() === preset.toUpperCase()
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset.toUpperCase())}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-offset-2 transition-transform hover:scale-110',
                selected ? 'ring-ink-400' : 'ring-transparent',
              )}
              style={{ backgroundColor: preset }}
              title={preset}
              aria-label={`Select color ${preset}`}
            >
              {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </button>
          )
        })}
      </div>

      <div className="mt-1 flex items-center gap-2">
        <label
          className="relative h-9 w-10 shrink-0 cursor-pointer overflow-hidden rounded-md border border-ink-200"
          style={{ backgroundColor: value }}
          title="Pick a custom color"
        >
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Custom color"
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(normalizeHex(e.target.value))}
          placeholder="#RRGGBB"
          maxLength={7}
          className={cn(
            'h-9 w-32 rounded-md border bg-white px-3 font-mono text-sm uppercase text-ink-900',
            'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400/40',
            error ? 'border-signal-critical focus:border-signal-critical' : 'border-ink-200 focus:border-brand-400',
          )}
          aria-invalid={!!error}
        />
      </div>

      {error ? (
        <span className="text-xs text-signal-critical">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-400">{hint}</span>
      ) : null}
    </div>
  )
}
