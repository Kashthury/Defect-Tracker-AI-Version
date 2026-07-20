import { useCallback, useMemo, useState } from 'react'
import { Validator, isEmptyValue } from '@/utils/validation'

type FieldConfig<V> = { required?: boolean; label: string; validate?: Validator<V> }
export type FormSchema<T extends Record<string, any>> = { [K in keyof T]?: FieldConfig<T[K]> }

interface UseFormOptions<T extends Record<string, any>> {
  initialValues: T
  schema?: FormSchema<T>
  /** Pass true for "edit" forms so the submit/update button stays disabled until a field changes. */
  requireDirtyToSubmit?: boolean
}

/**
 * Shared form-behavior hook implementing the spec's common validation rules:
 *  - required fields marked with * (consumer renders the *, this hook drives the error)
 *  - empty required fields show a small inline error ("X is required.")
 *  - the error clears automatically once the field becomes valid
 *  - values are trimmed before validation; spaces-only counts as empty
 *  - submission is blocked while any error remains
 *  - for edit forms, tracks which fields changed and only enables Update once dirty
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  schema = {},
  requireDirtyToSubmit = false,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [dirtyFields, setDirtyFields] = useState<Set<keyof T>>(new Set())

  const validateField = useCallback(
    (name: keyof T, rawValue: any): string | undefined => {
      const config = schema[name]
      if (!config) return undefined
      const value = typeof rawValue === 'string' ? rawValue : rawValue
      if (config.required && isEmptyValue(value)) {
        return `${config.label} is required.`
      }
      if (config.validate) {
        return config.validate(value, values)
      }
      return undefined
    },
    [schema, values],
  )

  const setValue = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }))
      setTouched((prev) => ({ ...prev, [name]: true }))
      setDirtyFields((prev) => {
        const next = new Set(prev)
        if (value !== initialValues[name]) next.add(name)
        else next.delete(name)
        return next
      })
      setErrors((prev) => {
        const message = validateField(name, value)
        const next = { ...prev }
        if (message) next[name] = message
        else delete next[name]
        return next
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialValues, validateField],
  )

  const validateAll = useCallback((): boolean => {
    const nextErrors: Partial<Record<keyof T, string>> = {}
    for (const key of Object.keys(schema) as (keyof T)[]) {
      const message = validateField(key, values[key])
      if (message) nextErrors[key] = message
    }
    setErrors(nextErrors)
    setTouched(Object.fromEntries(Object.keys(schema).map((k) => [k, true])) as Partial<Record<keyof T, boolean>>)
    return Object.keys(nextErrors).length === 0
  }, [schema, values, validateField])

  const isDirty = dirtyFields.size > 0
  const hasErrors = Object.keys(errors).length > 0
  const canSubmit = useMemo(() => {
    if (hasErrors) return false
    if (requireDirtyToSubmit && !isDirty) return false
    return true
  }, [hasErrors, requireDirtyToSubmit, isDirty])

  const reset = useCallback((next: T = initialValues) => {
    setValues(next)
    setErrors({})
    setTouched({})
    setDirtyFields(new Set())
  }, [initialValues])

  return { values, errors, touched, isDirty, canSubmit, setValue, validateAll, reset }
}
