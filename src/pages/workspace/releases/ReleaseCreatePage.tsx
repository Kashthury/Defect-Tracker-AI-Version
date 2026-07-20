import React, { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ReleaseForm } from '@/components/releases/ReleaseForm'
import { ProjectWorkspaceOutletContext } from '@/components/projects/ProjectWorkspaceLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { ROUTES } from '@/constants/routes'
import { useToast } from '@/context/ToastContext'
import { useRelease } from '@/hooks/useRelease'
import { releaseService } from '@/services/releaseService'
import { ReleaseFormPayload } from '@/types/release'
import { toSelectedRelease } from '@/utils/release'

const INITIAL_VALUES: ReleaseFormPayload = {
  name: '',
  version: '',
  releaseTypeId: '',
  description: '',
  releaseDate: '',
  status: 'ON_HOLD',
}

export const ReleaseCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { project } = useOutletContext<ProjectWorkspaceOutletContext>()
  const { setSelectedRelease, clearSelectedRelease } = useRelease()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const releaseListPath = ROUTES.PROJECT_RELEASES.replace(':projectId', project.id)

  useEffect(() => {
    clearSelectedRelease()
  }, [clearSelectedRelease, project.id])

  const handleSubmit = async (values: ReleaseFormPayload) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const result = await releaseService.createRelease(project.id, values)
      if (result.success) {
        setSelectedRelease(toSelectedRelease(result.data))
        toast.success(result.message)
        navigate(
          ROUTES.PROJECT_RELEASE_DETAIL
            .replace(':projectId', project.id)
            .replace(':releaseId', result.data.id),
        )
      } else setSubmitError(result.message)
    } catch {
      setSubmitError('An unexpected error occurred while creating the release.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (project.status !== 'ACTIVE') {
    return <div className="py-12"><ErrorMessage message="Releases cannot be created for an inactive project." /></div>
  }

  return (
    <div className="mx-auto max-w-5xl">
      <button type="button" onClick={() => navigate(releaseListPath)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"><ArrowLeft className="h-4 w-4" />Back to Releases</button>
      <PageHeader title="Create Release" description="Create a release for the selected project." />
      <ReleaseForm mode="create" initialValues={INITIAL_VALUES} projectStartDate={project.startDate} projectEndDate={project.endDate} isSubmitting={isSubmitting} submitError={submitError} onCancel={() => navigate(releaseListPath)} onSubmit={handleSubmit} />
    </div>
  )
}
