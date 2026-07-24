import { useParams } from 'react-router-dom'
import { useProject } from './useProject'

export const useProjectScope = () => {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>()
  const { selectedProject, activeProjects } = useProject()
  const selectedProjectId = activeProjects.some(
    (project) => String(project.projectId) === String(selectedProject?.projectId),
  )
    ? selectedProject?.projectId
    : undefined

  return {
    projectId: routeProjectId ?? selectedProjectId,
    isProjectRoute: Boolean(routeProjectId),
  }
}
