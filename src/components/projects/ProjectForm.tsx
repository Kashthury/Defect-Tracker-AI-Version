import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Dropdown } from '@/components/common/Dropdown'
import { Input } from '@/components/common/Input'
import { FormActions } from '@/components/forms/FormActions'
import { FormRow } from '@/components/forms/FormRow'
import { ROLE_TYPES, formatRoleType } from '@/constants/roleTypes'
import { useForm } from '@/hooks/useForm'
import { designationService } from '@/services/designationService'
import { projectAllocationService } from '@/services/projectAllocationService'
import { roleService } from '@/services/roleService'
import { Designation } from '@/types/auth'
import { AvailableProjectManager, ProjectFormPayload } from '@/types/project'
import { RoleRecord } from '@/types/role'
import { email } from '@/utils/validation'

interface ProjectFormProps {
  mode: 'create' | 'edit'
  initialValues: ProjectFormPayload
  projectId?: string
  submitError?: string | null
  isSubmitting: boolean
  onCancel: () => void
  onSubmit: (values: ProjectFormPayload) => void
}

const percentValidator = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return 'Allocation Percentage must be greater than 0.'
  if (value > 100) return 'Allocation Percentage cannot exceed 100%.'
  return undefined
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  mode,
  initialValues,
  projectId,
  submitError,
  isSubmitting,
  onCancel,
  onSubmit,
}) => {
  const [designations, setDesignations] = useState<Designation[]>([])
  const [roles, setRoles] = useState<RoleRecord[]>([])
  const [availableManagers, setAvailableManagers] = useState<AvailableProjectManager[]>([])
  const [isLoadingReferences, setIsLoadingReferences] = useState(true)
  const [isLoadingManagers, setIsLoadingManagers] = useState(false)
  const [referenceError, setReferenceError] = useState<string | null>(null)
  const [dateWarnings, setDateWarnings] = useState<string[]>([])

  const form = useForm<ProjectFormPayload>({
    initialValues,
    requireDirtyToSubmit: mode === 'edit',
    schema: {
      name: { required: true, label: 'Project Name' },
      startDate: { required: true, label: 'Start Date' },
      endDate: {
        required: true,
        label: 'End Date',
        validate: (value, values) =>
          values?.startDate && value < values.startDate
            ? 'End Date cannot be earlier than Start Date.'
            : undefined,
      },
      designationId: { required: true, label: 'Designation' },
      managerId: { required: true, label: 'Project Manager' },
      projectRoleId: { required: true, label: 'Project Role' },
      allocationPercentage: {
        required: true,
        label: 'Allocation Percentage',
        validate: percentValidator,
      },
      allocationStartDate: { required: true, label: 'Allocation Start Date' },
      allocationEndDate: {
        required: true,
        label: 'Allocation End Date',
        validate: (value, values) => {
          if (values?.allocationStartDate && value < values.allocationStartDate) {
            return 'Allocation End Date cannot be earlier than Allocation Start Date.'
          }
          if (values?.endDate && value > values.endDate) {
            return 'Allocation End Date must be within the project period.'
          }
          return undefined
        },
      },
      clientName: { required: true, label: 'Client Name' },
      clientCountry: { required: true, label: 'Client Country' },
      clientEmail: { required: true, label: 'Client Email Address', validate: email('Client Email Address') },
    },
  })

  useEffect(() => {
    let active = true
    Promise.all([
      designationService.getDesignations({ pageNumber: 0, pageSize: 100, sortBy: 'title' }),
      roleService.getRoles({ pageNumber: 0, pageSize: 100, filters: { status: 'ACTIVE' } }),
    ])
      .then(([designationResult, roleResult]) => {
        if (!active) return
        if (!designationResult.success || !roleResult.success) {
          setReferenceError(
            designationResult.success ? roleResult.message : designationResult.message,
          )
          return
        }
        setDesignations(designationResult.data.content)
        const sortedRoles = [...roleResult.data.content].sort((a, b) => {
          const aPriority = a.roleType === ROLE_TYPES.PROJECT_MANAGER ? 0 : 1
          const bPriority = b.roleType === ROLE_TYPES.PROJECT_MANAGER ? 0 : 1
          return aPriority - bPriority || a.name.localeCompare(b.name)
        })
        setRoles(sortedRoles)
        if (!form.values.projectRoleId) {
          const preferred = sortedRoles.find((role) => role.roleType === ROLE_TYPES.PROJECT_MANAGER)
          if (preferred) form.setValue('projectRoleId', preferred.id)
        }
      })
      .catch(() => {
        if (active) setReferenceError('Unable to load project form reference data.')
      })
      .finally(() => {
        if (active) setIsLoadingReferences(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (
      !form.values.designationId ||
      !form.values.allocationStartDate ||
      !form.values.allocationEndDate ||
      form.values.allocationEndDate < form.values.allocationStartDate ||
      form.values.allocationPercentage <= 0
    ) {
      setAvailableManagers([])
      return
    }

    let active = true
    setIsLoadingManagers(true)
    projectAllocationService
      .getAvailableProjectManagers(
        form.values.designationId,
        form.values.allocationStartDate,
        form.values.allocationEndDate,
        form.values.allocationPercentage,
        projectId,
      )
      .then((result) => {
        if (!active) return
        if (result.success) setAvailableManagers(result.data)
        else setReferenceError(result.message)
      })
      .catch(() => {
        if (active) setReferenceError('Unable to calculate Project Manager availability.')
      })
      .finally(() => {
        if (active) setIsLoadingManagers(false)
      })
    return () => {
      active = false
    }
  }, [
    form.values.designationId,
    form.values.allocationStartDate,
    form.values.allocationEndDate,
    form.values.allocationPercentage,
    projectId,
  ])

  useEffect(() => {
    if (mode !== 'edit' || !projectId || !form.values.startDate || !form.values.endDate) return
    let active = true
    projectAllocationService
      .getProjectDateWarnings(projectId, form.values.startDate, form.values.endDate)
      .then((result) => {
        if (active && result.success) setDateWarnings(result.data)
      })
    return () => {
      active = false
    }
  }, [mode, projectId, form.values.startDate, form.values.endDate])

  const designationOptions = designations.map((designation) => ({
    label: designation.title,
    value: designation.id,
  }))
  const roleOptions = roles.map((role) => ({
    label: `${role.name} (${formatRoleType(role.roleType)})`,
    value: role.id,
  }))
  const managerOptions = availableManagers.map((manager) => ({
    label: `${manager.employeeName} | ${manager.designationName} | Current ${manager.currentAllocationPercentage}% | Available ${manager.availablePercentage}%`,
    value: manager.employeeId,
  }))
  const selectedManager = useMemo(
    () => availableManagers.find((manager) => manager.employeeId === form.values.managerId),
    [availableManagers, form.values.managerId],
  )

  const handleSubmit = () => {
    if (!form.validateAll()) return
    onSubmit(form.values)
  }

  const handleProjectStartDate = (value: string) => {
    const previous = form.values.startDate
    form.setValue('startDate', value)
    if (mode === 'create' && (!form.values.allocationStartDate || form.values.allocationStartDate === previous)) {
      form.setValue('allocationStartDate', value)
    }
  }

  const handleProjectEndDate = (value: string) => {
    const previous = form.values.endDate
    form.setValue('endDate', value)
    if (mode === 'create' && (!form.values.allocationEndDate || form.values.allocationEndDate === previous)) {
      form.setValue('allocationEndDate', value)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {(submitError || referenceError) && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-signal-critical">
          {submitError || referenceError}
        </div>
      )}

      {dateWarnings.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Allocation dates require review.</p>
              {dateWarnings.map((warning) => <p key={warning} className="mt-1 text-xs">{warning}</p>)}
            </div>
          </div>
        </div>
      )}

      <Card title="Project Information">
        <div className="flex flex-col gap-5">
          <FormRow columns={1}>
            <Input
              label="Project Name"
              name="name"
              required
              value={form.values.name}
              error={form.touched.name ? form.errors.name : undefined}
              onChange={(event) => form.setValue('name', event.target.value)}
            />
          </FormRow>
          <FormRow columns={1}>
            <Input
              label="Description"
              name="description"
              value={form.values.description}
              onChange={(event) => form.setValue('description', event.target.value)}
            />
          </FormRow>
          <FormRow>
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              required
              value={form.values.startDate}
              error={form.touched.startDate ? form.errors.startDate : undefined}
              onChange={(event) => handleProjectStartDate(event.target.value)}
            />
            <Input
              label="End Date"
              name="endDate"
              type="date"
              required
              value={form.values.endDate}
              error={form.touched.endDate ? form.errors.endDate : undefined}
              onChange={(event) => handleProjectEndDate(event.target.value)}
            />
          </FormRow>
        </div>
      </Card>

      <Card title="Project Manager Selection" subtitle="Availability is calculated from overlapping active allocations.">
        <div className="flex flex-col gap-5">
          <FormRow>
            <Dropdown
              label="Designation"
              name="designationId"
              required
              options={designationOptions}
              value={form.values.designationId}
              error={form.touched.designationId ? form.errors.designationId : undefined}
              disabled={isLoadingReferences}
              onChange={(event) => {
                form.setValue('designationId', event.target.value)
                form.setValue('managerId', '')
              }}
            />
            <Dropdown
              label="Project Manager"
              name="managerId"
              required
              options={managerOptions}
              value={form.values.managerId}
              error={form.touched.managerId ? form.errors.managerId : undefined}
              disabled={isLoadingManagers || !form.values.designationId}
              placeholder={isLoadingManagers ? 'Calculating availability...' : 'Select available manager...'}
              onChange={(event) => form.setValue('managerId', event.target.value)}
            />
          </FormRow>
          <FormRow>
            <Dropdown
              label="Project Role"
              name="projectRoleId"
              required
              options={roleOptions}
              value={form.values.projectRoleId}
              error={form.touched.projectRoleId ? form.errors.projectRoleId : undefined}
              disabled={isLoadingReferences}
              onChange={(event) => form.setValue('projectRoleId', event.target.value)}
            />
            <Input
              label="Allocation Percentage"
              name="allocationPercentage"
              type="number"
              min={1}
              max={100}
              required
              value={form.values.allocationPercentage}
              error={form.touched.allocationPercentage ? form.errors.allocationPercentage : undefined}
              onChange={(event) => form.setValue('allocationPercentage', Number(event.target.value))}
            />
          </FormRow>
          <FormRow>
            <Input
              label="Allocation Start Date"
              name="allocationStartDate"
              type="date"
              required
              disabled={mode === 'edit'}
              value={form.values.allocationStartDate}
              error={form.touched.allocationStartDate ? form.errors.allocationStartDate : undefined}
              hint={mode === 'edit' ? 'The original allocation start date cannot be changed.' : undefined}
              onChange={(event) => form.setValue('allocationStartDate', event.target.value)}
            />
            <Input
              label="Allocation End Date"
              name="allocationEndDate"
              type="date"
              required
              value={form.values.allocationEndDate}
              error={form.touched.allocationEndDate ? form.errors.allocationEndDate : undefined}
              onChange={(event) => form.setValue('allocationEndDate', event.target.value)}
            />
          </FormRow>

          {selectedManager && (
            <div className="grid gap-3 border-y border-ink-100 py-3 sm:grid-cols-3">
              <div><p className="text-xs text-ink-400">Current Allocation</p><p className="mt-1 text-sm font-semibold text-ink-800">{selectedManager.currentAllocationPercentage}%</p></div>
              <div><p className="text-xs text-ink-400">Available Capacity</p><p className="mt-1 text-sm font-semibold text-signal-low">{selectedManager.availablePercentage}%</p></div>
              <div><p className="text-xs text-ink-400">After Assignment</p><p className="mt-1 text-sm font-semibold text-brand-600">{selectedManager.currentAllocationPercentage + form.values.allocationPercentage}%</p></div>
            </div>
          )}
          {form.values.managerId && !selectedManager && !isLoadingManagers && (
            <p className="text-sm text-signal-critical">
              This employee does not have enough available capacity for the selected date range and allocation percentage.
            </p>
          )}
        </div>
      </Card>

      <Card title="Client Information">
        <div className="flex flex-col gap-5">
          <FormRow>
            <Input label="Client Name" name="clientName" required value={form.values.clientName} error={form.touched.clientName ? form.errors.clientName : undefined} onChange={(event) => form.setValue('clientName', event.target.value)} />
            <Input label="Client Phone Number" name="clientPhone" type="tel" value={form.values.clientPhone} onChange={(event) => form.setValue('clientPhone', event.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Client Country" name="clientCountry" required value={form.values.clientCountry} error={form.touched.clientCountry ? form.errors.clientCountry : undefined} onChange={(event) => form.setValue('clientCountry', event.target.value)} />
            <Input label="Client Email Address" name="clientEmail" type="email" required value={form.values.clientEmail} error={form.touched.clientEmail ? form.errors.clientEmail : undefined} onChange={(event) => form.setValue('clientEmail', event.target.value)} />
          </FormRow>
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
        <FormActions
          onCancel={onCancel}
          onSubmit={handleSubmit}
          submitLabel={mode === 'create' ? 'Create Project' : 'Save Changes'}
          isSubmitting={isSubmitting}
          isSubmitDisabled={mode === 'edit' ? !form.canSubmit : false}
        />
      </div>
    </div>
  )
}

