export const getTodayDateString = () => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

export const addDaysToDate = (date: string, days: number) => {
  const [year, month, day] = date.split('-').map(Number)
  const value = new Date(year, month - 1, day + days)
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

export const isDateRangeValid = (startDate: string, endDate: string) =>
  Boolean(startDate && endDate && startDate <= endDate)

export const isDateWithinRange = (date: string, startDate: string, endDate: string) =>
  Boolean(date && startDate && endDate && date >= startDate && date <= endDate)
