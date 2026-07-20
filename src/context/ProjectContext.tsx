import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { SELECTED_PROJECT_STORAGE_KEY } from '@/constants/app'
import { PRIV } from '@/constants/privileges'
import { useAuth } from '@/hooks/useAuth'
import { projectService } from '@/services/projectService'
import { SelectedProject } from '@/types/project'

interface ProjectContextValue {
  selectedProject: SelectedProject | null
  activeProjects: SelectedProject[]
  isLoadingProjects: boolean
  projectsError: string | null
  setSelectedProject: (project: SelectedProject) => void
  clearSelectedProject: () => void
  refreshProjects: () => Promise<void>
}

export const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

const readSelectedProject = (): SelectedProject | null => {
  try {
    const value = sessionStorage.getItem(SELECTED_PROJECT_STORAGE_KEY)
    return value ? (JSON.parse(value) as SelectedProject) : null
  } catch {
    return null
  }
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isInitializing, hasPrivilege } = useAuth()
  const [selectedProject, setSelectedProjectState] = useState<SelectedProject | null>(readSelectedProject)
  const [activeProjects, setActiveProjects] = useState<SelectedProject[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedProject) {
      sessionStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, JSON.stringify(selectedProject))
    } else {
      sessionStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY)
    }
  }, [selectedProject])

  const setSelectedProject = useCallback((project: SelectedProject) => {
    setSelectedProjectState(project)
  }, [])
  const clearSelectedProject = useCallback(() => {
    sessionStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY)
    setSelectedProjectState(null)
  }, [])

  const refreshProjects = useCallback(async () => {
    if (!user) {
      setActiveProjects([])
      setIsLoadingProjects(false)
      return
    }

    setIsLoadingProjects(true)
    setProjectsError(null)
    const canViewAllProjects =
      hasPrivilege(PRIV.PROJECT_CREATE) ||
      hasPrivilege(PRIV.PROJECT_UPDATE) ||
      hasPrivilege(PRIV.PROJECT_DELETE)
    try {
      const result = await projectService.getAuthorizedActiveProjects(user.id, canViewAllProjects)
      if (result.success) {
        setActiveProjects(result.data)
        setSelectedProjectState((current) => {
          if (!current || current.status !== 'ACTIVE') return current
          return result.data.some((project) => project.projectId === current.projectId)
            ? current
            : null
        })
      } else {
        setActiveProjects([])
        setProjectsError(result.message)
      }
    } catch {
      setActiveProjects([])
      setProjectsError('Unable to load available projects.')
    } finally {
      setIsLoadingProjects(false)
    }
  }, [hasPrivilege, user])

  useEffect(() => {
    if (isInitializing) return
    if (!isAuthenticated || !user) {
      clearSelectedProject()
      setActiveProjects([])
      setProjectsError(null)
      setIsLoadingProjects(false)
      return
    }
    refreshProjects()
  }, [clearSelectedProject, isAuthenticated, isInitializing, refreshProjects, user])

  const value = useMemo(
    () => ({
      selectedProject,
      activeProjects,
      isLoadingProjects,
      projectsError,
      setSelectedProject,
      clearSelectedProject,
      refreshProjects,
    }),
    [
      selectedProject,
      activeProjects,
      isLoadingProjects,
      projectsError,
      setSelectedProject,
      clearSelectedProject,
      refreshProjects,
    ],
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}
