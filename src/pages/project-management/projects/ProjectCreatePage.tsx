import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { PageHeader } from '@/components/layout/PageHeader'
import { ROUTES } from '@/constants/routes'
import { useToast } from '@/context/ToastContext'
import { useProject } from '@/hooks/useProject'
import { projectService } from '@/services/projectService'
import { ProjectFormPayload } from '@/types/project'

const INITIAL_VALUES: ProjectFormPayload = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  designationId: '',
  managerId: '',
  projectRoleId: '',
  allocationPercentage: 50,
  allocationStartDate: '',
  allocationEndDate: '',
  clientName: '',
  clientPhone: '',
  clientCountry: '',
  clientEmail: '',
}

export const ProjectCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { setSelectedProject, refreshProjects } = useProject()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (values: ProjectFormPayload) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const result = await projectService.createProject(values)
      if (result.success) {
        await refreshProjects()
        setSelectedProject({
          projectId: result.data.id,
          projectName: result.data.name,
          status: result.data.status,
        })
        toast.success(result.message)
        navigate(ROUTES.PROJECT_OVERVIEW.replace(':projectId', result.data.id))
      } else setSubmitError(result.message)
    } catch {
      setSubmitError('An unexpected error occurred while creating the project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <button type="button" onClick={() => navigate(ROUTES.PROJECTS)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </button>
      <PageHeader title="Create Project" description="Create an active project and its initial Project Manager allocation." />
      <ProjectForm
        mode="create"
        initialValues={INITIAL_VALUES}
        submitError={submitError}
        isSubmitting={isSubmitting}
        onCancel={() => navigate(ROUTES.PROJECTS)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
