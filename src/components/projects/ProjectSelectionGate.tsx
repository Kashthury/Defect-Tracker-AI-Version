import React from 'react'
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
    return <EmptyState icon={<FolderKanban className="h-5 w-5" />} title="No active projects available." />
  }
  if (!selectedProject || !activeProjects.some((project) => project.projectId === selectedProject.projectId)) {
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
}> = ({ isProjectRoute, children }) =>
  isProjectRoute ? <>{children}</> : <ProjectSelectionGate>{children}</ProjectSelectionGate>
