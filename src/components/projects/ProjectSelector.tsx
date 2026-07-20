import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, FolderKanban, Search, X } from 'lucide-react'
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
  const [query, setQuery] = useState('')

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return activeProjects
    return activeProjects.filter((project) =>
      project.projectName.toLowerCase().includes(normalizedQuery),
    )
  }, [activeProjects, query])

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  useEffect(() => {
    if (!isOpen) setQuery('')
  }, [isOpen])

  useEffect(() => {
    if (!selectedProject) return
    const nextPath = getProjectRouteForCurrentModule(location.pathname, selectedProject.projectId)
    if (nextPath !== location.pathname) {
      navigate({ pathname: nextPath, search: location.search, hash: location.hash }, { replace: true })
    }
  }, [location.hash, location.pathname, location.search, navigate, selectedProject])

  const selectProject = (projectId: string) => {
    const project = activeProjects.find((item) => item.projectId === projectId)
    if (!project) return

    if (project.projectId !== selectedProject?.projectId) setSelectedProject(project)
    setIsOpen(false)
    const nextPath = getProjectRouteForCurrentModule(location.pathname, project.projectId)
    if (nextPath !== location.pathname) {
      navigate({ pathname: nextPath, search: location.search, hash: location.hash }, { replace: true })
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
        disabled={isLoadingProjects || (!hasActiveProjects && !projectsError)}
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
              (hasActiveProjects ? 'Select a project' : 'No active projects available.')}
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
              <div className="relative border-b border-ink-100 p-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => event.key === 'Escape' && setIsOpen(false)}
                  placeholder="Search project name..."
                  className="h-8 w-full rounded-md border border-ink-200 bg-white pl-9 pr-8 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                />
                {query && (
                  <button type="button" aria-label="Clear project search" onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div role="listbox" className="max-h-64 overflow-y-auto p-1">
                {filteredProjects.length === 0 ? (
                  <p className="px-3 py-5 text-center text-xs text-ink-500">
                    {hasActiveProjects ? 'No projects match your search.' : 'No active projects available.'}
                  </p>
                ) : (
                  filteredProjects.map((project) => (
                    <button
                      key={project.projectId}
                      type="button"
                      role="option"
                      aria-selected={project.projectId === selectedProject?.projectId}
                      onClick={() => selectProject(project.projectId)}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
                    >
                      <span className="min-w-0 flex-1 truncate">{project.projectName}</span>
                      {project.projectId === selectedProject?.projectId && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
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
