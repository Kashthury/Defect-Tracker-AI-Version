import React, { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, Edit, Tag } from 'lucide-react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Loader } from '@/components/common/Loader'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectWorkspaceOutletContext } from '@/components/projects/ProjectWorkspaceLayout'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { useRelease } from '@/hooks/useRelease'
import { releaseService } from '@/services/releaseService'
import { ReleaseRecord } from '@/types/release'
import { formatDate } from '@/utils/format'
import { toSelectedRelease } from '@/utils/release'

export const ReleaseWorkspacePage: React.FC = () => {
  const { releaseId } = useParams<{ releaseId: string }>()
  const { project } = useOutletContext<ProjectWorkspaceOutletContext>()
  const { hasPrivilege } = useAuth()
  const { setSelectedRelease } = useRelease()
  const navigate = useNavigate()
  const [release, setRelease] = useState<ReleaseRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const releaseRoute = (route: string) => route.replace(':projectId', project.id).replace(':releaseId', releaseId ?? '')

  const loadRelease = useCallback(async () => {
    if (!releaseId) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await releaseService.getReleaseById(project.id, releaseId)
      if (!result.success) {
        setError(result.message)
        return
      }
      if (result.data.status !== 'ACTIVE') {
        setError('Only the ACTIVE release can be opened in the Release Workspace.')
        return
      }
      setRelease(result.data)
      setSelectedRelease(toSelectedRelease(result.data))
    } catch {
      setError('An unexpected error occurred while loading the Release Workspace.')
    } finally {
      setIsLoading(false)
    }
  }, [project.id, releaseId, setSelectedRelease])

  useEffect(() => {
    loadRelease()
  }, [loadRelease])

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader label="Loading Release Workspace..." /></div>
  if (error || !release) return <div className="py-12"><ErrorMessage message={error || 'Release not found.'} onRetry={loadRelease} /></div>

  return (
    <div className="flex flex-col gap-5">
      <button type="button" onClick={() => navigate(releaseRoute(ROUTES.PROJECT_RELEASES))} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"><ArrowLeft className="h-4 w-4" />Back to Releases</button>
      <PageHeader
        title="Release Workspace"
        description={`${release.name} | Version ${release.version}`}
        actions={project.status === 'ACTIVE' && hasPrivilege(PRIV.RELEASE_UPDATE) ? <Button variant="outline" leftIcon={<Edit className="h-4 w-4" />} onClick={() => navigate(releaseRoute(ROUTES.PROJECT_RELEASE_EDIT))}>Edit Release</Button> : undefined}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-ink-100 bg-white p-4 shadow-panel"><div className="flex items-center justify-between"><p className="text-xs font-medium text-ink-500">Status</p><Badge tone="success" dot>Active</Badge></div><p className="mt-3 text-sm font-semibold text-ink-900">Current Release</p></div>
        <div className="rounded-lg border border-ink-100 bg-white p-4 shadow-panel"><div className="flex items-center justify-between"><p className="text-xs font-medium text-ink-500">Release Date</p><CalendarDays className="h-4 w-4 text-ink-400" /></div><p className="mt-3 text-sm font-semibold text-ink-900">{formatDate(release.releaseDate)}</p></div>
        <div className="rounded-lg border border-ink-100 bg-white p-4 shadow-panel"><div className="flex items-center justify-between"><p className="text-xs font-medium text-ink-500">Release Type</p><Tag className="h-4 w-4 text-ink-400" /></div><p className="mt-3 text-sm font-semibold text-ink-900">{release.releaseTypeName}</p></div>
      </div>

      <Card title="Release Scope" subtitle={`Release date: ${formatDate(release.releaseDate)}`}>
        <p className="text-sm leading-6 text-ink-700">{release.description || 'No release description provided.'}</p>
      </Card>
    </div>
  )
}
