import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useProject } from '@/hooks/useProject'
import { SelectedRelease } from '@/types/release'

interface ReleaseContextValue {
  selectedRelease: SelectedRelease | null
  setSelectedRelease: (release: SelectedRelease) => void
  clearSelectedRelease: () => void
}

export const ReleaseContext = createContext<ReleaseContextValue | undefined>(undefined)

export const ReleaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedProject } = useProject()
  const [selectedRelease, setSelectedReleaseState] = useState<SelectedRelease | null>(null)

  const setSelectedRelease = useCallback((release: SelectedRelease) => {
    setSelectedReleaseState(release)
  }, [])
  const clearSelectedRelease = useCallback(() => setSelectedReleaseState(null), [])

  useEffect(() => {
    clearSelectedRelease()
  }, [clearSelectedRelease, selectedProject?.projectId])

  const value = useMemo(
    () => ({ selectedRelease, setSelectedRelease, clearSelectedRelease }),
    [clearSelectedRelease, selectedRelease, setSelectedRelease],
  )

  return <ReleaseContext.Provider value={value}>{children}</ReleaseContext.Provider>
}
