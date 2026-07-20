export type Validator<V = any> = (value: V, allValues?: Record<string, any>) => string | undefined

/** A value is "empty" if it's null/undefined, or a string that's blank after trimming. */
export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  return false
}

export const required = (label: string): Validator<string> => (value) => {
  if (isEmptyValue(value)) return `${label} is required.`
  return undefined
}

export const minLength = (min: number, label: string): Validator<string> => (value) => {
  if (isEmptyValue(value)) return undefined
  if (value.trim().length < min) return `${label} must be at least ${min} characters.`
  return undefined
}

export const email = (label = 'Email'): Validator<string> => (value) => {
  if (isEmptyValue(value)) return undefined
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!pattern.test(value.trim())) return `${label} must be a valid email address.`
  return undefined
}

export const phone = (label = 'Phone'): Validator<string> => (value) => {
  if (isEmptyValue(value)) return undefined
  const pattern = /^\+?[\d\s\-().]{7,20}$/
  if (!pattern.test(value.trim())) return `${label} must be a valid phone number.`
  return undefined
}

export const composeValidators = <V,>(...validators: Validator<V>[]): Validator<V> => (value, allValues) => {
  for (const validate of validators) {
    const result = validate(value, allValues)
    if (result) return result
  }
  return undefined
}
