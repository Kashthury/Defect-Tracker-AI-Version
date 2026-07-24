import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { FolderKanban } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Loader } from '@/components/common/Loader'
import { useProject } from '@/hooks/useProject'

export const ProjectSelectionGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    selectedProject,
    activeProjects,
    isLoadingProjects,
    projectsError,
    refreshProjects,
  } = useProject()

  if (isLoadingProjects) {
    return <div className="flex h-52 items-center justify-center"><Loader label="Loading projects..." /></div>
  }
  if (projectsError) {
    return <div className="py-10"><ErrorMessage message={projectsError} onRetry={refreshProjects} /></div>
  }
  if (activeProjects.length === 0) {
    return <EmptyState icon={<FolderKanban className="h-5 w-5" />} title="No projects have been assigned to you." />
  }
  if (!selectedProject || !activeProjects.some((project) => String(project.projectId) === String(selectedProject.projectId))) {
    return (
      <EmptyState
        icon={<FolderKanban className="h-5 w-5" />}
        title="Select a project to continue."
        description="Use the project selector above to load this module."
      />
    )
  }

  return <>{children}</>
}

export const ProjectModuleGate: React.FC<{
  isProjectRoute: boolean
  children: React.ReactNode
}> = ({ isProjectRoute, children }) => {
  const { projectId } = useParams<{ projectId: string }>()
  const {
    selectedProject,
    activeProjects,
    isLoadingProjects,
    projectsError,
    refreshProjects,
    setSelectedProject,
  } = useProject()
  const routeProject = isProjectRoute
    ? activeProjects.find((project) => String(project.projectId) === String(projectId))
    : undefined

  useEffect(() => {
    if (!routeProject || String(selectedProject?.projectId) === String(routeProject.projectId)) return
    setSelectedProject(routeProject)
  }, [routeProject, selectedProject?.projectId, setSelectedProject])

  if (!isProjectRoute) return <ProjectSelectionGate>{children}</ProjectSelectionGate>
  if (isLoadingProjects) {
    return <div className="flex h-52 items-center justify-center"><Loader label="Loading projects..." /></div>
  }
  if (projectsError) {
    return <div className="py-10"><ErrorMessage message={projectsError} onRetry={refreshProjects} /></div>
  }
  if (!projectId || !routeProject) {
    return <ErrorMessage message="You do not have access to this Project." />
  }
  if (String(selectedProject?.projectId) !== String(routeProject.projectId)) {
    return <div className="flex h-52 items-center justify-center"><Loader label="Loading Project..." /></div>
  }
  return <>{children}</>
}
