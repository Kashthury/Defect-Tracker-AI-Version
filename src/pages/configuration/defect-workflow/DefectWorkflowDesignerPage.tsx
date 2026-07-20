import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Dropdown } from '@/components/common/Dropdown'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Loader } from '@/components/common/Loader'
import { FormActions } from '@/components/forms/FormActions'
import { PageHeader } from '@/components/layout/PageHeader'
import { DefectWorkflowCanvas } from '@/components/workflow/DefectWorkflowCanvas'
import { DEFECT_STATUS_CODES } from '@/constants/statusTypes'
import { ROUTES } from '@/constants/routes'
import { useToast } from '@/context/ToastContext'
import { defectWorkflowService } from '@/services/defectWorkflowService'
import { statusTypeService } from '@/services/statusTypeService'
import {
  DefectWorkflow,
  DefectWorkflowNode,
  DefectWorkflowTransition,
  SaveDefectWorkflowPayload,
} from '@/types/defectWorkflow'
import { StatusTypeRecord } from '@/types/statusType'

const EMPTY_WORKFLOW: DefectWorkflow = {
  id: 'defect-workflow-1',
  name: 'Defect Workflow',
  nodes: [],
  transitions: [],
  updatedAt: '',
}

export const DefectWorkflowDesignerPage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [workflow, setWorkflow] = useState<DefectWorkflow | null>(null)
  const [statusTypes, setStatusTypes] = useState<StatusTypeRecord[]>([])
  const [selectedStatusId, setSelectedStatusId] = useState('')
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [workflowExists, setWorkflowExists] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const loadDesigner = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [workflowResult, statusResult] = await Promise.all([
        defectWorkflowService.getWorkflow(),
        statusTypeService.getStatusTypes({ pageNumber: 0, pageSize: 100, sortBy: 'name' }),
      ])
      if (!statusResult.success) {
        setError(statusResult.message)
        return
      }

      setStatusTypes(
        statusResult.data.content.filter((status) => DEFECT_STATUS_CODES.includes(status.code)),
      )
      const initialWorkflow = workflowResult.success ? workflowResult.data : EMPTY_WORKFLOW
      setWorkflowExists(workflowResult.success)
      setWorkflow(initialWorkflow)
      setSavedSnapshot(JSON.stringify(initialWorkflow))
    } catch {
      setError('An unexpected error occurred while loading the workflow designer.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDesigner()
  }, [loadDesigner])

  const statusById = useMemo(
    () => new Map(statusTypes.map((status) => [status.id, status])),
    [statusTypes],
  )
  const availableStatusOptions = useMemo(() => {
    const usedStatusIds = new Set(workflow?.nodes.map((node) => node.statusId) ?? [])
    return statusTypes
      .filter((status) => !usedStatusIds.has(status.id))
      .map((status) => ({ label: `${status.name} (${status.code})`, value: status.id }))
  }, [statusTypes, workflow?.nodes])
  const isDirty = workflow ? JSON.stringify(workflow) !== savedSnapshot : false

  const addNode = () => {
    if (!workflow || !selectedStatusId || !statusById.has(selectedStatusId)) return
    if (workflow.nodes.some((node) => node.statusId === selectedStatusId)) {
      toast.error('This status is already in the workflow.')
      return
    }

    const index = workflow.nodes.length
    const node: DefectWorkflowNode = {
      id: `node-${selectedStatusId}-${Date.now()}`,
      workflowId: workflow.id,
      statusId: selectedStatusId,
      positionX: 70 + (index % 5) * 210,
      positionY: 80 + Math.floor(index / 5) * 150,
    }
    setWorkflow({ ...workflow, nodes: [...workflow.nodes, node] })
    setSelectedStatusId('')
  }

  const addTransition = (fromStatusId: string, toStatusId: string): boolean => {
    if (!workflow) return false
    if (fromStatusId === toStatusId) {
      toast.error('A status cannot connect to itself.')
      return false
    }
    if (
      !workflow.nodes.some((node) => node.statusId === fromStatusId) ||
      !workflow.nodes.some((node) => node.statusId === toStatusId)
    ) {
      toast.error('Select valid source and target status nodes.')
      return false
    }
    if (
      workflow.transitions.some(
        (transition) =>
          transition.fromStatusId === fromStatusId && transition.toStatusId === toStatusId,
      )
    ) {
      toast.error('This transition already exists.')
      return false
    }

    const transition: DefectWorkflowTransition = {
      id: `transition-${Date.now()}-${workflow.transitions.length}`,
      workflowId: workflow.id,
      fromStatusId,
      toStatusId,
    }
    setWorkflow({ ...workflow, transitions: [...workflow.transitions, transition] })
    return true
  }

  const removeTransition = (transitionId: string) => {
    if (!workflow) return
    setWorkflow({
      ...workflow,
      transitions: workflow.transitions.filter((transition) => transition.id !== transitionId),
    })
  }

  const removeNode = (statusId: string) => {
    if (!workflow) return
    const isConnected = workflow.transitions.some(
      (transition) =>
        transition.fromStatusId === statusId || transition.toStatusId === statusId,
    )
    if (isConnected) {
      toast.error("Remove this status's connections before deleting the node.")
      return
    }
    setWorkflow({
      ...workflow,
      nodes: workflow.nodes.filter((node) => node.statusId !== statusId),
    })
  }

  const saveWorkflow = async () => {
    if (!workflow) return
    setIsSubmitting(true)
    setSubmitError(null)

    const payload: SaveDefectWorkflowPayload = {
      name: workflow.name,
      nodes: workflow.nodes,
      transitions: workflow.transitions,
    }

    try {
      const result = workflowExists
        ? await defectWorkflowService.updateWorkflow(workflow.id, payload)
        : await defectWorkflowService.saveWorkflow(payload)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.DEFECT_WORKFLOW)
      } else {
        setSubmitError(result.message)
        toast.error(result.message)
      }
    } catch {
      const message = 'An unexpected error occurred while saving the defect workflow.'
      setSubmitError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader label="Loading workflow designer..." />
      </div>
    )
  }

  if (error || !workflow) {
    return (
      <div className="py-12">
        <ErrorMessage message={error || 'Workflow designer is unavailable.'} onRetry={loadDesigner} />
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate(ROUTES.DEFECT_WORKFLOW)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Workflow
      </button>

      <PageHeader
        title="Defect Workflow Designer"
        description="Configure allowed status transitions for Defect Management."
      />

      {submitError && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-signal-critical">
          {submitError}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-ink-200 bg-white p-4 shadow-panel sm:flex-row sm:items-end">
        <div className="w-full sm:max-w-sm">
          <Dropdown
            label="Add Status Type"
            options={availableStatusOptions}
            value={selectedStatusId}
            onChange={(event) => setSelectedStatusId(event.target.value)}
            placeholder={
              availableStatusOptions.length > 0 ? 'Select configured status...' : 'All statuses added'
            }
            disabled={availableStatusOptions.length === 0}
          />
        </div>
        <Button
          variant="secondary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={addNode}
          disabled={!selectedStatusId}
        >
          Add Node
        </Button>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <DefectWorkflowCanvas
          nodes={workflow.nodes}
          transitions={workflow.transitions}
          statusTypes={statusTypes}
          editable
          onNodesChange={(nodes) => setWorkflow((current) => (current ? { ...current, nodes } : current))}
          onAddTransition={addTransition}
          onRemoveTransition={removeTransition}
          onRemoveNode={removeNode}
        />

        <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-panel">
          <div className="border-b border-ink-100 bg-ink-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-ink-800">Transitions</h3>
            <p className="mt-0.5 text-xs text-ink-500">{workflow.transitions.length} configured</p>
          </div>
          <div className="max-h-[590px] overflow-y-auto">
            {workflow.transitions.length === 0 ? (
              <EmptyState title="No transitions" description="Connect two status nodes on the canvas." />
            ) : (
              workflow.transitions.map((transition) => {
                const from = statusById.get(transition.fromStatusId)
                const to = statusById.get(transition.toStatusId)
                return (
                  <div
                    key={transition.id}
                    className="flex items-center gap-2 border-b border-ink-100 px-3 py-3 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-ink-700">
                        <span className="truncate" title={from?.name}>{from?.name ?? 'Unknown'}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                        <span className="truncate" title={to?.name}>{to?.name ?? 'Unknown'}</span>
                      </div>
                      <p className="mt-1 truncate font-mono text-[10px] text-ink-400">
                        {from?.code ?? transition.fromStatusId} to {to?.code ?? transition.toStatusId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTransition(transition.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-ink-400 hover:bg-red-50 hover:text-signal-critical"
                      title="Remove transition"
                      aria-label={`Remove transition from ${from?.name ?? 'source'} to ${to?.name ?? 'target'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
        <FormActions
          onCancel={() => navigate(ROUTES.DEFECT_WORKFLOW)}
          onSubmit={saveWorkflow}
          submitLabel="Save Workflow"
          isSubmitting={isSubmitting}
          isSubmitDisabled={!isDirty}
        />
      </div>
    </div>
  )
}
