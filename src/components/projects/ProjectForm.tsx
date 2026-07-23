import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Dropdown } from '@/components/common/Dropdown'
import { Input } from '@/components/common/Input'
import { FormActions } from '@/components/forms/FormActions'
import { FormRow } from '@/components/forms/FormRow'
import { useForm } from '@/hooks/useForm'
import { designationService } from '@/services/designationService'
import { employeeService } from '@/services/employeeService'
import { projectAllocationService } from '@/services/projectAllocationService'
import { Designation } from '@/types/auth'
import { EmployeeDropdownResponse } from '@/types/employee'
import { ProjectFormPayload } from '@/types/project'
import { getTodayDateString } from '@/utils/date'
import { formatDate } from '@/utils/format'
import { email } from '@/utils/validation'

interface ProjectFormProps {
  mode: 'create' | 'edit'
  initialValues: ProjectFormPayload
  projectId?: string
  currentManagerAllocationStartDate?: string
  currentManagerAllocationEndDate?: string
  submitError?: string | null
  isSubmitting: boolean
  onCancel: () => void
  onSubmit: (values: ProjectFormPayload) => void
}

const normalizeId = (value: string) => String(value ?? '').trim()
const normalizePercentage = (value: number) => Number(value)

const percentValidator = (value: number) => {
  if (!Number.isFinite(value)) return 'Manager Allocation Percentage must be a valid number.'
  if (value <= 0) return 'Manager Allocation Percentage must be greater than 0.'
  if (value > 100) return 'Manager Allocation Percentage cannot exceed 100%.'
  return undefined
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  mode,
  initialValues,
  projectId,
  currentManagerAllocationStartDate,
  currentManagerAllocationEndDate,
  submitError,
  isSubmitting,
  onCancel,
  onSubmit,
}) => {
  const submitErrorRef = useRef<HTMLDivElement>(null)
  const [designations, setDesignations] = useState<Designation[]>([])
  const [availableManagers, setAvailableManagers] = useState<EmployeeDropdownResponse[]>([])
  const [isLoadingReferences, setIsLoadingReferences] = useState(true)
  const [isLoadingManagers, setIsLoadingManagers] = useState(false)
  const [referenceError, setReferenceError] = useState<string | null>(null)
  const [managerError, setManagerError] = useState<string | null>(null)
  const [dateWarnings, setDateWarnings] = useState<string[]>([])

  const initialManagerId = normalizeId(initialValues.managerId)
  const initialPercentage = normalizePercentage(initialValues.managerAllocationPercentage)

  const form = useForm<ProjectFormPayload>({
    initialValues,
    requireDirtyToSubmit: mode === 'edit',
    schema: {
      name: {
        required: true,
        label: 'Project Name',
        validate: (value) => value.trim() ? undefined : 'Project Name is required.',
      },
      startDate: { required: true, label: 'Start Date' },
      endDate: {
        required: true,
        label: 'End Date',
        validate: (value, values) =>
          values?.startDate && value < values.startDate
            ? 'End Date cannot be earlier than Start Date.'
            : undefined,
      },
      designationId: { required: true, label: 'Project Manager Designation' },
      managerId: { required: true, label: 'Project Manager' },
      managerAllocationPercentage: {
        required: true,
        label: 'Manager Allocation Percentage',
        validate: percentValidator,
      },
      managerChangeEffectiveDate: {
        label: 'Manager Change Effective Date',
        validate: (value, values) => {
          if (mode !== 'edit') return undefined
          const managerChanged = normalizeId(values?.managerId ?? '') !== initialManagerId
          const percentageChanged = normalizePercentage(values?.managerAllocationPercentage ?? 0) !== initialPercentage
          if (!managerChanged && !percentageChanged) return undefined
          if (!value) return 'Manager Change Effective Date is required.'
          if (values?.startDate && value < values.startDate) return 'Effective Date must be within the Project period.'
          if (values?.endDate && value > values.endDate) return 'Effective Date must be within the Project period.'
          return undefined
        },
      },
      clientName: { required: true, label: 'Client Name' },
      clientCountry: { required: true, label: 'Client Country' },
      clientEmail: { required: true, label: 'Client Email Address', validate: email('Client Email Address') },
    },
  })

  const managerChanged = normalizeId(form.values.managerId) !== initialManagerId
  const managerPercentageChanged = normalizePercentage(form.values.managerAllocationPercentage) !== initialPercentage
  const showEffectiveDate = mode === 'edit' && (managerChanged || managerPercentageChanged)

  useEffect(() => {
    if (!submitError) return
    const errorAlert = submitErrorRef.current
    errorAlert?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    errorAlert?.focus({ preventScroll: true })
  }, [submitError])

  useEffect(() => {
    let active = true
    designationService
      .getDesignations({ pageNumber: 0, pageSize: 100, sortBy: 'title', sortDir: 'asc', filters: { active: true } })
      .then((result) => {
        if (!active) return
        if (result.success) setDesignations(result.data.content)
        else setReferenceError(result.message)
      })
      .catch(() => {
        if (active) setReferenceError('Unable to load active designations.')
      })
      .finally(() => {
        if (active) setIsLoadingReferences(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!form.values.designationId) {
      setAvailableManagers([])
      setManagerError(null)
      setIsLoadingManagers(false)
      return
    }

    let active = true
    setIsLoadingManagers(true)
    setManagerError(null)
    employeeService
      .getEmployeesByDesignation(form.values.designationId)
      .then((result) => {
        if (!active) return
        if (result.success) setAvailableManagers(result.data)
        else {
          setAvailableManagers([])
          setManagerError(result.message)
        }
      })
      .catch(() => {
        if (active) {
          setAvailableManagers([])
          setManagerError('Unable to load active employees for the selected designation.')
        }
      })
      .finally(() => {
        if (active) setIsLoadingManagers(false)
      })
    return () => { active = false }
  }, [form.values.designationId])

  useEffect(() => {
    if (mode !== 'edit' || !projectId || !form.values.startDate || !form.values.endDate) return
    let active = true
    projectAllocationService
      .getProjectDateWarnings(projectId, form.values.startDate, form.values.endDate)
      .then((result) => {
        if (active) setDateWarnings(result.success ? result.data : [])
      })
    return () => { active = false }
  }, [mode, projectId, form.values.startDate, form.values.endDate])

  const designationOptions = designations.map((designation) => ({
    label: designation.title,
    value: designation.id,
  }))
  const managerOptions = availableManagers.map((manager) => ({
    label: `${manager.employeeCode} - ${manager.fullName}`,
    value: String(manager.id),
  }))

  const requiredValuesPresent = useMemo(() => {
    const percentageError = percentValidator(form.values.managerAllocationPercentage)
    const effectiveDateValid = !showEffectiveDate || Boolean(
      form.values.managerChangeEffectiveDate &&
      (!form.values.startDate || form.values.managerChangeEffectiveDate >= form.values.startDate) &&
      (!form.values.endDate || form.values.managerChangeEffectiveDate <= form.values.endDate),
    )
    return Boolean(
      form.values.name.trim() &&
      form.values.startDate &&
      form.values.endDate &&
      form.values.endDate >= form.values.startDate &&
      form.values.designationId &&
      form.values.managerId &&
      !percentageError &&
      form.values.clientName.trim() &&
      form.values.clientCountry.trim() &&
      form.values.clientEmail.trim() &&
      effectiveDateValid,
    )
  }, [form.values, showEffectiveDate])

  const hasBlockingErrors = Object.entries(form.errors).some(
    ([field]) => field !== 'managerChangeEffectiveDate' || showEffectiveDate,
  )

  const handleSubmit = () => {
    if (!form.validateAll()) return
    onSubmit({
      ...form.values,
      managerChangeEffectiveDate: showEffectiveDate ? form.values.managerChangeEffectiveDate : '',
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {(submitError || referenceError) && (
        <div
          ref={submitError ? submitErrorRef : undefined}
          role="alert"
          aria-live={submitError ? 'assertive' : 'polite'}
          tabIndex={submitError ? -1 : undefined}
          className="flex scroll-mt-4 gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-signal-critical outline-none focus:ring-2 focus:ring-signal-critical/30"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">{submitError ? `Project could not be ${mode === 'create' ? 'created' : 'updated'}` : 'Project form is unavailable'}</p>
            <p className="mt-1 text-sm leading-5 text-red-700">{submitError || referenceError}</p>
            {submitError && <p className="mt-2 text-xs text-red-600">Review the message, update the relevant Project details, and try again.</p>}
          </div>
        </div>
      )}

      {dateWarnings.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Project dates require review.</p>
              {dateWarnings.map((warning) => <p key={warning} className="mt-1 text-xs">{warning}</p>)}
            </div>
          </div>
        </div>
      )}

      <Card title="Project Information">
        <div className="flex flex-col gap-5">
          <FormRow columns={1}>
            <Input label="Project Name" name="name" required value={form.values.name} error={form.touched.name ? form.errors.name : undefined} onChange={(event) => form.setValue('name', event.target.value)} />
          </FormRow>
          <FormRow columns={1}>
            <Input label="Description" name="description" value={form.values.description} onChange={(event) => form.setValue('description', event.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Start Date" name="startDate" type="date" required value={form.values.startDate} error={form.touched.startDate ? form.errors.startDate : undefined} onChange={(event) => form.setValue('startDate', event.target.value)} />
            <Input label="End Date" name="endDate" type="date" required value={form.values.endDate} error={form.touched.endDate ? form.errors.endDate : undefined} onChange={(event) => form.setValue('endDate', event.target.value)} />
          </FormRow>
          {mode === 'edit' && form.values.startDate !== initialValues.startDate && (
            <p className="text-xs text-amber-700">Project Start Date can only be changed before Project activity begins. The backend will reject changes that conflict with allocation history.</p>
          )}
          {mode === 'edit' && form.values.endDate > initialValues.endDate && (
            <p className="text-xs text-brand-700">The Project Manager allocation will also be validated and extended.</p>
          )}
          {mode === 'edit' && form.values.endDate < initialValues.endDate && (
            <p className="text-xs text-amber-700">The update may be rejected if active or scheduled allocations extend beyond the new Project end date.</p>
          )}
        </div>
      </Card>

      <Card title="Project Manager Selection" subtitle="The backend derives the manager allocation period from the Project dates.">
        <div className="flex flex-col gap-5">
          <FormRow columns={3}>
            <Dropdown
              label="Project Manager Designation"
              name="designationId"
              required
              options={designationOptions}
              value={form.values.designationId}
              error={form.touched.designationId ? form.errors.designationId : undefined}
              disabled={isLoadingReferences}
              onChange={(event) => {
                if (event.target.value !== form.values.designationId) {
                  form.setValue('designationId', event.target.value)
                  form.setValue('managerId', '')
                }
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
              placeholder={!form.values.designationId ? 'Select a designation first' : isLoadingManagers ? 'Loading project managers...' : availableManagers.length === 0 ? 'No active employees found' : 'Select project manager...'}
              onChange={(event) => form.setValue('managerId', event.target.value)}
            />
            <Input
              label="Manager Allocation Percentage (%)"
              name="managerAllocationPercentage"
              type="number"
              min={1}
              max={100}
              step={1}
              required
              value={Number.isFinite(form.values.managerAllocationPercentage) ? form.values.managerAllocationPercentage : ''}
              error={form.touched.managerAllocationPercentage ? form.errors.managerAllocationPercentage : undefined}
              onChange={(event) => form.setValue('managerAllocationPercentage', event.target.value === '' ? Number.NaN : Number(event.target.value))}
            />
          </FormRow>

          {mode === 'edit' && (currentManagerAllocationStartDate || currentManagerAllocationEndDate) && (
            <div className="grid gap-4 rounded-lg border border-ink-100 bg-ink-50 p-4 text-sm sm:grid-cols-2">
              <div><p className="text-xs text-ink-400">Current Allocation Start</p><p className="mt-1 font-medium text-ink-800">{formatDate(currentManagerAllocationStartDate)}</p></div>
              <div><p className="text-xs text-ink-400">Current Allocation End</p><p className="mt-1 font-medium text-ink-800">{formatDate(currentManagerAllocationEndDate)}</p></div>
            </div>
          )}

          {showEffectiveDate && (
            <FormRow columns={1}>
              <Input
                label="Manager Change Effective Date"
                name="managerChangeEffectiveDate"
                type="date"
                required
                min={form.values.startDate || undefined}
                max={form.values.endDate || undefined}
                value={form.values.managerChangeEffectiveDate}
                error={form.touched.managerChangeEffectiveDate ? form.errors.managerChangeEffectiveDate : undefined}
                hint="The current manager allocation will end one day before this date, and the new allocation will begin on this date."
                onChange={(event) => form.setValue('managerChangeEffectiveDate', event.target.value)}
              />
            </FormRow>
          )}
          {mode === 'edit' && (
            <p className="text-xs text-ink-500">
              {form.values.startDate > getTodayDateString()
                ? 'The scheduled manager allocation may be updated directly.'
                : 'Manager changes will preserve the previous manager allocation history.'}
            </p>
          )}

          {managerError && <p className="text-sm text-signal-critical">{managerError}</p>}
          {!managerError && form.values.designationId && !isLoadingManagers && availableManagers.length === 0 && (
            <p className="text-sm text-ink-500">No active employees found for this designation.</p>
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
          isSubmitDisabled={isSubmitting || isLoadingReferences || isLoadingManagers || !requiredValuesPresent || hasBlockingErrors || (mode === 'edit' && !form.isDirty)}
        />
      </div>
    </div>
  )
}
