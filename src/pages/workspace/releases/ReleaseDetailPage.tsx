import React, { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Edit, ExternalLink } from 'lucide-react'
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
import { releaseStatusLabel, releaseStatusTone, toSelectedRelease } from '@/utils/release'

export const ReleaseDetailPage: React.FC = () => {
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
      if (result.success) {
        setRelease(result.data)
        setSelectedRelease(toSelectedRelease(result.data))
      } else setError(result.message)
    } catch {
      setError('An unexpected error occurred while loading the release.')
    } finally {
      setIsLoading(false)
    }
  }, [project.id, releaseId, setSelectedRelease])

  useEffect(() => {
    loadRelease()
  }, [loadRelease])

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader label="Loading release details..." /></div>
  if (error || !release) return <div className="py-12"><ErrorMessage message={error || 'Release not found.'} onRetry={loadRelease} /></div>

  return (
    <div className="flex flex-col gap-5">
      <button type="button" onClick={() => navigate(releaseRoute(ROUTES.PROJECT_RELEASES))} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"><ArrowLeft className="h-4 w-4" />Back to Releases</button>
      <PageHeader
        title={release.name}
        description={`Version ${release.version}`}
        actions={
          <>
            {release.status === 'ACTIVE' && <Button variant="outline" leftIcon={<ExternalLink className="h-4 w-4" />} onClick={() => navigate(releaseRoute(ROUTES.PROJECT_RELEASE_WORKSPACE))}>Open Workspace</Button>}
            {project.status === 'ACTIVE' && hasPrivilege(PRIV.RELEASE_UPDATE) && release.status !== 'COMPLETED' && <Button leftIcon={<Edit className="h-4 w-4" />} onClick={() => navigate(releaseRoute(ROUTES.PROJECT_RELEASE_EDIT))}>Edit Release</Button>}
          </>
        }
      />

      <Card title="Release Details" actions={<Badge tone={releaseStatusTone(release.status)} dot>{releaseStatusLabel(release.status)}</Badge>}>
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-ink-400">Release Type</p><p className="mt-1 text-sm font-medium text-ink-700">{release.releaseTypeName}</p></div>
          <div><p className="text-xs text-ink-400">Version</p><p className="mt-1 font-mono text-sm text-ink-700">{release.version}</p></div>
          <div><p className="text-xs text-ink-400">Release Date</p><p className="mt-1 text-sm font-medium text-ink-700">{formatDate(release.releaseDate)}</p></div>
          <div className="sm:col-span-2 lg:col-span-3"><p className="text-xs text-ink-400">Description</p><p className="mt-1 text-sm leading-6 text-ink-700">{release.description || 'No description provided.'}</p></div>
        </div>
      </Card>
    </div>
  )
}
