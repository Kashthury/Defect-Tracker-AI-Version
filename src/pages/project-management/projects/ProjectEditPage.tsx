import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Loader } from '@/components/common/Loader'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { PageHeader } from '@/components/layout/PageHeader'
import { ROUTES } from '@/constants/routes'
import { useToast } from '@/context/ToastContext'
import { useProject } from '@/hooks/useProject'
import { projectService } from '@/services/projectService'
import { Project, ProjectFormPayload, ProjectUpdateRequest } from '@/types/project'

export const ProjectEditPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { setSelectedProject, refreshProjects } = useProject()
  const [project, setProject] = useState<Project | null>(null)
  const [initialValues, setInitialValues] = useState<ProjectFormPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const loadProject = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setLoadError(null)
    try {
      const result = await projectService.getProjectById(projectId)
      if (!result.success) {
        setLoadError(result.message)
        return
      }
      const item = result.data
      setProject(item)
      setInitialValues({
        name: item.name,
        description: item.description,
        startDate: item.startDate,
        endDate: item.endDate,
        designationId: item.managerDesignationId,
        managerId: item.managerId,
        managerAllocationPercentage: item.managerAllocationPercentage,
        managerChangeEffectiveDate: '',
        clientName: item.clientName,
        clientPhone: item.clientPhone,
        clientCountry: item.clientCountry,
        clientEmail: item.clientEmail,
      })
    } catch {
      setLoadError('An unexpected error occurred while loading the project.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  const handleSubmit = async (values: ProjectFormPayload) => {
    if (!projectId) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const managerChanged = String(values.managerId) !== String(initialValues?.managerId ?? '')
      const percentageChanged = Number(values.managerAllocationPercentage) !== Number(initialValues?.managerAllocationPercentage)
      const payload: ProjectUpdateRequest = {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        startDate: values.startDate,
        endDate: values.endDate,
        managerId: Number(values.managerId),
        managerAllocationPercentage: Number(values.managerAllocationPercentage),
        managerDesignationId: Number(values.designationId),
        clientName: values.clientName.trim(),
        clientPhone: values.clientPhone.trim() || undefined,
        clientCountry: values.clientCountry.trim(),
        clientEmail: values.clientEmail.trim(),
        ...((managerChanged || percentageChanged) && values.managerChangeEffectiveDate
          ? { managerChangeEffectiveDate: values.managerChangeEffectiveDate }
          : {}),
      }
      const result = await projectService.updateProject(projectId, payload)
      if (result.success) {
        await refreshProjects()
        setSelectedProject({ projectId, projectName: result.data.name, status: result.data.status })
        toast.success(result.message)
        navigate(ROUTES.PROJECT_OVERVIEW.replace(':projectId', projectId))
      } else setSubmitError(result.message)
    } catch {
      setSubmitError('An unexpected error occurred while updating the project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader label="Loading project..." /></div>
  if (loadError || !project || !initialValues) return <div className="py-12"><ErrorMessage message={loadError || 'Project not found.'} onRetry={loadProject} /></div>

  const overviewRoute = ROUTES.PROJECT_OVERVIEW.replace(':projectId', project.id)
  return (
    <div className="mx-auto max-w-5xl">
      <button type="button" onClick={() => navigate(overviewRoute)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </button>
      <PageHeader title="Update Project" description={`Update ${project.name} and its Project Manager allocation.`} />
      <ProjectForm
        mode="edit"
        projectId={project.id}
        initialValues={initialValues}
        currentManagerAllocationStartDate={project.managerAllocationStartDate}
        currentManagerAllocationEndDate={project.managerAllocationEndDate}
        submitError={submitError}
        isSubmitting={isSubmitting}
        onCancel={() => navigate(overviewRoute)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
