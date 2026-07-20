import React, { useCallback, useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock3, ExternalLink, ListChecks, Plus } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Loader } from '@/components/common/Loader'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectWorkspaceOutletContext } from '@/components/projects/ProjectWorkspaceLayout'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { useRelease } from '@/hooks/useRelease'
import { releaseService } from '@/services/releaseService'
import { ReleaseOverview } from '@/types/release'
import { formatDate, formatNumber } from '@/utils/format'
import { releaseStatusLabel, releaseStatusTone, toSelectedRelease } from '@/utils/release'

export const ProjectOverviewPage: React.FC = () => {
  const { project } = useOutletContext<ProjectWorkspaceOutletContext>()
  const { hasPrivilege } = useAuth()
  const { setSelectedRelease } = useRelease()
  const navigate = useNavigate()
  const [overview, setOverview] = useState<ReleaseOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const releaseRoute = (route: string, releaseId?: string) =>
    route.replace(':projectId', project.id).replace(':releaseId', releaseId ?? '')

  const loadOverview = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await releaseService.getReleaseOverview(project.id)
      if (result.success) setOverview(result.data)
      else setError(result.message)
    } catch {
      setError('An unexpected error occurred while loading the release overview.')
    } finally {
      setIsLoading(false)
    }
  }, [project.id])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  const openActiveExecution = () => {
    if (!overview?.activeRelease) return
    setSelectedRelease(toSelectedRelease(overview.activeRelease))
    navigate(releaseRoute(ROUTES.PROJECT_TEST_CASE_EXECUTION))
  }

  if (isLoading) return <div className="flex h-52 items-center justify-center"><Loader label="Loading release overview..." /></div>
  if (error || !overview) return <div className="py-10"><ErrorMessage message={error || 'Release overview is unavailable.'} onRetry={loadOverview} /></div>

  const summary = [
    { label: 'Total Releases', value: overview.totalReleases, icon: ListChecks },
    { label: 'Active', value: overview.activeCount, icon: ExternalLink },
    { label: 'On Hold', value: overview.onHoldCount, icon: Clock3 },
    { label: 'Completed', value: overview.completedCount, icon: CheckCircle2 },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Overview"
        description="Review the active release and manage the release lifecycle."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(releaseRoute(ROUTES.PROJECT_RELEASES))}>View All Releases</Button>
            {project.status === 'ACTIVE' && hasPrivilege(PRIV.RELEASE_CREATE) && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(releaseRoute(ROUTES.PROJECT_RELEASE_CREATE))}>Create Release</Button>}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-xl border border-ink-200 border-l-4 border-l-brand-400 bg-white p-4 shadow-panel ring-1 ring-ink-100/60 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-floating/30">
              <div className="flex items-center justify-between"><p className="text-xs font-medium text-ink-500">{item.label}</p><Icon className="h-4 w-4 text-ink-400" /></div>
              <p className="mt-2 text-xl font-semibold text-ink-900">{formatNumber(item.value)}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Active Release"
          className="border-ink-200 border-t-4 border-t-emerald-500 ring-1 ring-ink-100/70 hover:border-emerald-300"
          actions={overview.activeRelease ? <Badge tone="success" dot>Active</Badge> : undefined}
        >
          {overview.activeRelease ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-base font-semibold text-ink-900">{overview.activeRelease.name}</p><p className="mt-1 font-mono text-xs text-ink-500">Version {overview.activeRelease.version}</p></div>
                <Button size="sm" rightIcon={<ExternalLink className="h-4 w-4" />} onClick={openActiveExecution}>Open Execution</Button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><p className="text-xs text-ink-400">Release Type</p><p className="mt-1 text-sm font-medium text-ink-700">{overview.activeRelease.releaseTypeName}</p></div>
                <div><p className="text-xs text-ink-400">Release Date</p><p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink-700"><CalendarDays className="h-4 w-4 text-ink-400" />{formatDate(overview.activeRelease.releaseDate)}</p></div>
              </div>
            </div>
          ) : (
            <EmptyState title="No active release" description="Activate an existing release or create a new release when planning is ready." />
          )}
        </Card>

        <Card
          title="Next Planned Release"
          className="border-ink-200 border-t-4 border-t-amber-500 ring-1 ring-ink-100/70 hover:border-amber-300"
          actions={overview.nextRelease ? <Badge tone={releaseStatusTone(overview.nextRelease.status)}>{releaseStatusLabel(overview.nextRelease.status)}</Badge> : undefined}
        >
          {overview.nextRelease ? (
            <div>
              <p className="text-base font-semibold text-ink-900">{overview.nextRelease.name}</p>
              <p className="mt-1 font-mono text-xs text-ink-500">Version {overview.nextRelease.version}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><p className="text-xs text-ink-400">Release Type</p><p className="mt-1 text-sm font-medium text-ink-700">{overview.nextRelease.releaseTypeName}</p></div>
                <div><p className="text-xs text-ink-400">Target Date</p><p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink-700"><CalendarDays className="h-4 w-4 text-ink-400" />{formatDate(overview.nextRelease.releaseDate)}</p></div>
              </div>
            </div>
          ) : (
            <EmptyState title="No planned release" description="There are no ON_HOLD releases waiting to be activated." />
          )}
        </Card>
      </div>
    </div>
  )
}
