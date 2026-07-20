import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, GitBranch } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Loader } from '@/components/common/Loader'
import { DefectWorkflowCanvas } from '@/components/workflow/DefectWorkflowCanvas'
import { PageHeader } from '@/components/layout/PageHeader'
import { PRIV } from '@/constants/privileges'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { defectWorkflowService } from '@/services/defectWorkflowService'
import { statusTypeService } from '@/services/statusTypeService'
import { DefectWorkflow } from '@/types/defectWorkflow'
import { StatusTypeRecord } from '@/types/statusType'
import { formatDate } from '@/utils/format'

export const DefectWorkflowViewPage: React.FC = () => {
  const navigate = useNavigate()
  const { hasPrivilege } = useAuth()
  const [workflow, setWorkflow] = useState<DefectWorkflow | null>(null)
  const [statusTypes, setStatusTypes] = useState<StatusTypeRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadWorkflow = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [workflowResult, statusResult] = await Promise.all([
        defectWorkflowService.getWorkflow(),
        statusTypeService.getStatusTypes({ pageNumber: 0, pageSize: 100 }),
      ])

      if (!statusResult.success) {
        setError(statusResult.message)
        return
      }
      setStatusTypes(statusResult.data.content)

      if (workflowResult.success) setWorkflow(workflowResult.data)
      else if (workflowResult.message === 'Defect workflow is not configured.') setWorkflow(null)
      else setError(workflowResult.message)
    } catch {
      setError('An unexpected error occurred while loading the defect workflow.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWorkflow()
  }, [loadWorkflow])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader label="Loading defect workflow..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorMessage message={error} onRetry={loadWorkflow} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <button type="button" onClick={() => navigate(ROUTES.STATUS)} className="flex w-fit items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> Back to Status</button>
      <PageHeader
        title="Defect Status Workflow"
        description="Allowed lifecycle transitions for defects across the system."
        actions={
          hasPrivilege(PRIV.DEFECT_WORKFLOW_UPDATE) ? (
            <Button
              leftIcon={<Edit className="h-4 w-4" />}
              onClick={() => navigate(ROUTES.DEFECT_WORKFLOW_EDIT)}
            >
              {workflow ? 'Edit Workflow' : 'Create Workflow'}
            </Button>
          ) : undefined
        }
      />

      {!workflow ? (
        <div className="rounded-lg border border-ink-200 bg-white py-14 shadow-panel">
          <EmptyState
            icon={<GitBranch className="h-5 w-5" />}
            title="Defect workflow is not configured"
            description="Create the workflow to define the allowed defect status transitions."
            action={
              hasPrivilege(PRIV.DEFECT_WORKFLOW_UPDATE) ? (
                <Button size="sm" onClick={() => navigate(ROUTES.DEFECT_WORKFLOW_EDIT)}>
                  Create Workflow
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <div className="grid gap-3 border-y border-ink-100 bg-white px-1 py-3 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-ink-400">Workflow</p>
              <p className="mt-1 text-sm font-semibold text-ink-800">{workflow.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-400">Configuration</p>
              <p className="mt-1 text-sm text-ink-700">
                {workflow.nodes.length} statuses, {workflow.transitions.length} transitions
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-400">Last Updated</p>
              <p className="mt-1 text-sm text-ink-700">{formatDate(workflow.updatedAt)}</p>
            </div>
          </div>

          <DefectWorkflowCanvas
            nodes={workflow.nodes}
            transitions={workflow.transitions}
            statusTypes={statusTypes}
          />
        </>
      )}
    </div>
  )
}
