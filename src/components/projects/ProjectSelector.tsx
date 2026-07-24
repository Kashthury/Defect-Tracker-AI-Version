import React, { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, FolderKanban } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader } from '@/components/common/Loader'
import { useProject } from '@/hooks/useProject'
import { cn } from '@/utils/cn'
import { getProjectRouteForCurrentModule } from '@/utils/projectRouting'

interface ProjectSelectorProps {
  className?: string
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ className }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    selectedProject,
    activeProjects,
    isLoadingProjects,
    projectsError,
    setSelectedProject,
    refreshProjects,
  } = useProject()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  const selectProject = (projectId: string) => {
    const project = activeProjects.find((item) => String(item.projectId) === String(projectId))
    if (!project) return

    setIsOpen(false)
    const nextPath = getProjectRouteForCurrentModule(location.pathname, project.projectId)
    if (String(project.projectId) === String(selectedProject?.projectId) && nextPath === location.pathname) return
    if (nextPath !== location.pathname) {
      // Inside a Project workspace the route is authoritative. Navigate first
      // and let the workspace synchronizer perform the single context update.
      if (!/^\/projects\/[^/]+(?:\/|$)/.test(location.pathname)) setSelectedProject(project)
      navigate({ pathname: nextPath, search: location.search, hash: location.hash }, { replace: true })
    } else if (String(project.projectId) !== String(selectedProject?.projectId)) {
      setSelectedProject(project)
    }
  }

  const hasActiveProjects = activeProjects.length > 0

  return (
    <div ref={containerRef} className={cn('relative w-full sm:w-80', className)}>
      <label className="mb-1.5 block text-xs font-medium text-ink-500">Project</label>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        disabled={isLoadingProjects || activeProjects.length === 0}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-md border border-ink-200 bg-white px-3 text-left text-sm text-ink-800',
          'focus:outline-none focus:ring-2 focus:ring-brand-400/40 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400',
        )}
      >
        <FolderKanban className="h-4 w-4 shrink-0 text-ink-400" />
        <span className="min-w-0 flex-1 truncate">
          {isLoadingProjects
            ? 'Loading projects...'
            : projectsError
              ? 'Unable to load projects'
            : selectedProject?.projectName ||
              (hasActiveProjects ? 'Select a project' : 'No projects have been assigned to you.')}
        </span>
        {isLoadingProjects ? <Loader size="sm" /> : <ChevronDown className="h-4 w-4 shrink-0 text-ink-400" />}
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-md border border-ink-200 bg-white shadow-lg">
          {projectsError ? (
            <div className="p-3 text-center">
              <p className="text-xs text-signal-critical">{projectsError}</p>
              <button type="button" onClick={refreshProjects} className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700">
                Try again
              </button>
            </div>
          ) : (
            <>
              <div role="listbox" className="max-h-64 overflow-y-auto p-1">
                {activeProjects.length === 0 ? (
                  <p className="px-3 py-5 text-center text-xs text-ink-500">
                    No projects have been assigned to you.
                  </p>
                ) : (
                  activeProjects.map((project) => (
                    <button
                      key={project.projectId}
                      type="button"
                      role="option"
                      aria-selected={String(project.projectId) === String(selectedProject?.projectId)}
                      onClick={() => selectProject(project.projectId)}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
                    >
                      <span className="min-w-0 flex-1 truncate">{project.projectName}</span>
                      {String(project.projectId) === String(selectedProject?.projectId) && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
