import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SELECTED_PROJECT_STORAGE_KEY } from '@/constants/app'
import { ROUTES } from '@/constants/routes'
import { useToast } from '@/context/ToastContext'
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

interface ForbiddenProjectDetail {
  message?: string
  path?: string
}

export const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isInitializing } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const loadedUserIdRef = useRef<string | null>(null)
  const [selectedProject, setSelectedProjectState] = useState<SelectedProject | null>(null)
  const [activeProjects, setActiveProjects] = useState<SelectedProject[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedProject) sessionStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, JSON.stringify(selectedProject))
    else sessionStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY)
  }, [selectedProject])

  const setSelectedProject = useCallback((project: SelectedProject) => {
    setSelectedProjectState(project)
  }, [])

  const clearSelectedProject = useCallback(() => {
    sessionStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY)
    setSelectedProjectState(null)
  }, [])

  const refreshProjects = useCallback(async () => {
    if (!user?.id) {
      setActiveProjects([])
      setIsLoadingProjects(false)
      return
    }

    setIsLoadingProjects(true)
    setProjectsError(null)
    try {
      // The backend applies all user/super-user visibility rules. The frontend
      // deliberately sends no user, role, privilege, or "mine" filter.
      const result = await projectService.getAuthorizedActiveProjects()
      if (!result.success) {
        setActiveProjects([])
        setProjectsError(result.message)
        return
      }

      setActiveProjects(result.data)
      setSelectedProjectState((current) => {
        if (!current) return null
        const accessible = result.data.some((project) => project.projectId === current.projectId)
        if (accessible) return current
        sessionStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY)
        toast.info('Your selected project is no longer available. Select another assigned project.')
        return null
      })
    } catch {
      setActiveProjects([])
      setProjectsError('Unable to load available projects.')
    } finally {
      setIsLoadingProjects(false)
    }
  }, [toast, user?.id])

  useEffect(() => {
    if (isInitializing) return
    if (!isAuthenticated || !user?.id) {
      loadedUserIdRef.current = null
      clearSelectedProject()
      setActiveProjects([])
      setProjectsError(null)
      setIsLoadingProjects(false)
      return
    }

    if (loadedUserIdRef.current !== user.id) {
      loadedUserIdRef.current = user.id
      clearSelectedProject()
      setActiveProjects([])
      setProjectsError(null)
      void refreshProjects()
    }
  }, [clearSelectedProject, isAuthenticated, isInitializing, refreshProjects, user?.id])

  useEffect(() => {
    const handleProjectForbidden = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail as ForbiddenProjectDetail : undefined
      const message = detail?.message || 'You no longer have access to the selected project.'
      clearSelectedProject()
      setActiveProjects([])
      setProjectsError(message)
      toast.error(message)
      navigate(ROUTES.DASHBOARD, { replace: true })
    }
    window.addEventListener('project:forbidden', handleProjectForbidden)
    return () => window.removeEventListener('project:forbidden', handleProjectForbidden)
  }, [clearSelectedProject, navigate, toast])

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
    [selectedProject, activeProjects, isLoadingProjects, projectsError, setSelectedProject, clearSelectedProject, refreshProjects],
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}
