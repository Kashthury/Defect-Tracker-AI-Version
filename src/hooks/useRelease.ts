import { useContext } from 'react'
import { ReleaseContext } from '@/context/ReleaseContext'

export const useRelease = () => {
  const context = useContext(ReleaseContext)
  if (!context) throw new Error('useRelease must be used within a ReleaseProvider')
  return context
}
