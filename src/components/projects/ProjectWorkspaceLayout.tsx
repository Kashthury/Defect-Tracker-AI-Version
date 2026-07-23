import React, { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Loader } from '@/components/common/Loader'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { useProject } from '@/hooks/useProject'
import { projectService } from '@/services/projectService'
import { Project } from '@/types/project'
import { ProjectSelector } from './ProjectSelector'

export interface ProjectWorkspaceOutletContext {
  project: Project
  reloadProject: () => void
}

export const ProjectWorkspaceLayout: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { setSelectedProject } = useProject()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProject = useCallback(async () => {
    if (!projectId || !user) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await projectService.getAuthorizedProjectById(projectId)
      if (!result.success) {
        setError(result.message)
        return
      }
      setProject(result.data)
      setSelectedProject({
        projectId: result.data.id,
        projectName: result.data.name,
        status: result.data.status,
      })
    } catch {
      setError('An unexpected error occurred while loading the project workspace.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, setSelectedProject, user])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader label="Loading project workspace..." /></div>
  if (error || !project) return <div className="py-12"><ErrorMessage message={error || 'Project not found.'} onRetry={loadProject} /></div>

  const projectManagementPath = ROUTES.PROJECT_MANAGEMENT_HUB.replace(':projectId', project.id)
  const releaseManagementPath = ROUTES.PROJECT_RELEASE_HUB.replace(':projectId', project.id)
  const isLevelTwoHub = location.pathname === projectManagementPath || location.pathname === releaseManagementPath
  const isReleaseChild = location.pathname.startsWith(`${ROUTES.PROJECT_RELEASES.replace(':projectId', project.id)}`)
  const backTarget = isLevelTwoHub
    ? ROUTES.PROJECTS
    : isReleaseChild
      ? releaseManagementPath
      : projectManagementPath
  const backLabel = isLevelTwoHub
    ? 'Back to Projects'
    : isReleaseChild
      ? 'Back to Release Management'
      : 'Back to Project Management'

  return (
    <div className="flex flex-col gap-5">
      <div>
        <button type="button" onClick={() => navigate(backTarget)} className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-600 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </button>
        <ProjectSelector className="sm:w-96" />
      </div>

      {project.status !== 'ACTIVE' && (
        <div className="rounded-md border border-ink-200 bg-ink-100 px-4 py-3 text-sm text-ink-600">
          This project is {project.status === 'ON_HOLD' ? 'on hold' : 'completed'}. Historical project information remains available, but it is excluded from new selections and allocations.
        </div>
      )}

      <Outlet key={project.id} context={{ project, reloadProject: loadProject } satisfies ProjectWorkspaceOutletContext} />
    </div>
  )
}
