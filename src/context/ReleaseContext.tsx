import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useProject } from '@/hooks/useProject'
import { SelectedRelease } from '@/types/release'

interface ReleaseContextValue {
  selectedRelease: SelectedRelease | null
  releaseRevision: number
  setSelectedRelease: (release: SelectedRelease) => void
  clearSelectedRelease: () => void
  refreshReleases: () => void
}

export const ReleaseContext = createContext<ReleaseContextValue | undefined>(undefined)

export const ReleaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedProject } = useProject()
  const [selectedRelease, setSelectedReleaseState] = useState<SelectedRelease | null>(null)
  const [releaseRevision, setReleaseRevision] = useState(0)

  const setSelectedRelease = useCallback((release: SelectedRelease) => {
    setSelectedReleaseState(release)
  }, [])
  const clearSelectedRelease = useCallback(() => setSelectedReleaseState(null), [])
  const refreshReleases = useCallback(() => setReleaseRevision((value) => value + 1), [])

  useEffect(() => {
    clearSelectedRelease()
  }, [clearSelectedRelease, selectedProject?.projectId])

  const value = useMemo(
    () => ({ selectedRelease, releaseRevision, setSelectedRelease, clearSelectedRelease, refreshReleases }),
    [clearSelectedRelease, refreshReleases, releaseRevision, selectedRelease, setSelectedRelease],
  )

  return <ReleaseContext.Provider value={value}>{children}</ReleaseContext.Provider>
}
