import React, { useCallback, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Loader } from '@/components/common/Loader'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectWorkspaceOutletContext } from '@/components/projects/ProjectWorkspaceLayout'
import { ReleaseForm } from '@/components/releases/ReleaseForm'
import { ROUTES } from '@/constants/routes'
import { PRIV } from '@/constants/privileges'
import { useToast } from '@/context/ToastContext'
import { useRelease } from '@/hooks/useRelease'
import { useAuth } from '@/hooks/useAuth'
import { releaseService } from '@/services/releaseService'
import { ReleaseFormPayload, ReleaseRecord } from '@/types/release'
import { toSelectedRelease } from '@/utils/release'

export const ReleaseEditPage: React.FC = () => {
  const { releaseId } = useParams<{ releaseId: string }>()
  const { project } = useOutletContext<ProjectWorkspaceOutletContext>()
  const navigate = useNavigate()
  const toast = useToast()
  const { hasPrivilege } = useAuth()
  const { setSelectedRelease } = useRelease()
  const [release, setRelease] = useState<ReleaseRecord | null>(null)
  const [initialValues, setInitialValues] = useState<ReleaseFormPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const releaseListPath = ROUTES.PROJECT_RELEASES.replace(':projectId', project.id)

  const loadRelease = useCallback(async () => {
    if (!releaseId) return
    setIsLoading(true)
    setLoadError(null)
    try {
      const result = await releaseService.getReleaseById(project.id, releaseId)
      if (!result.success) {
        setLoadError(result.message)
        return
      }
      if (result.data.status === 'COMPLETED') {
        setLoadError('A COMPLETED release is historical and cannot be updated.')
        return
      }
      setRelease(result.data)
      setSelectedRelease(toSelectedRelease(result.data))
      setInitialValues({
        name: result.data.name,
        version: result.data.version,
        releaseTypeId: result.data.releaseTypeId,
        description: result.data.description,
        releaseDate: result.data.releaseDate,
        status: result.data.status,
      })
    } catch {
      setLoadError('An unexpected error occurred while loading the release.')
    } finally {
      setIsLoading(false)
    }
  }, [project.id, releaseId, setSelectedRelease])

  useEffect(() => {
    loadRelease()
  }, [loadRelease])

  const handleSubmit = async (values: ReleaseFormPayload) => {
    if (!releaseId) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const result = await releaseService.updateRelease(project.id, releaseId, values)
      if (result.success) {
        setSelectedRelease(toSelectedRelease(result.data))
        toast.success(result.message)
        navigate(
          ROUTES.PROJECT_RELEASE_DETAIL
            .replace(':projectId', project.id)
            .replace(':releaseId', releaseId),
        )
      } else setSubmitError(result.message)
    } catch {
      setSubmitError('An unexpected error occurred while updating the release.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader label="Loading release..." /></div>
  if (project.status !== 'ACTIVE') return <div className="py-12"><ErrorMessage message="Releases cannot be changed for an inactive project." /></div>
  if (loadError || !release || !initialValues) return <div className="py-12"><ErrorMessage message={loadError || 'Release not found.'} onRetry={loadRelease} /></div>

  return (
    <div className="mx-auto max-w-5xl">
      <button type="button" onClick={() => navigate(releaseListPath)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"><ArrowLeft className="h-4 w-4" />Back to Releases</button>
      <PageHeader title="Update Release" description={`Update ${release.name}.`} />
      <ReleaseForm mode="edit" initialValues={initialValues} projectStartDate={project.startDate} projectEndDate={project.endDate} isSubmitting={isSubmitting} submitError={submitError} canChangeStatus={hasPrivilege(PRIV.RELEASE_STATUS_CHANGE)} onCancel={() => navigate(releaseListPath)} onSubmit={handleSubmit} />
    </div>
  )
}
