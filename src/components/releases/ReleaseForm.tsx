import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/common/Card'
import { Dropdown } from '@/components/common/Dropdown'
import { Input } from '@/components/common/Input'
import { FormActions } from '@/components/forms/FormActions'
import { FormErrorAlert } from '@/components/forms/FormErrorAlert'
import { FormRow } from '@/components/forms/FormRow'
import { useForm } from '@/hooks/useForm'
import { releaseTypeService } from '@/services/releaseTypeService'
import { ReleaseFormPayload, ReleaseStatus } from '@/types/release'
import { RELEASE_STATUS_OPTIONS } from '@/utils/release'

interface ReleaseFormProps {
  mode: 'create' | 'edit'
  initialValues: ReleaseFormPayload
  projectStartDate: string
  projectEndDate: string
  isSubmitting: boolean
  submitError: string | null
  canChangeStatus?: boolean
  onCancel: () => void
  onSubmit: (values: ReleaseFormPayload) => void
}

export const ReleaseForm: React.FC<ReleaseFormProps> = ({
  mode,
  initialValues,
  projectStartDate,
  projectEndDate,
  isSubmitting,
  submitError,
  canChangeStatus = true,
  onCancel,
  onSubmit,
}) => {
  const [releaseTypes, setReleaseTypes] = useState<{ label: string; value: string }[]>([])
  const [releaseTypeError, setReleaseTypeError] = useState<string | null>(null)
  const schema = useMemo(
    () => ({
      name: { required: true, label: 'Release Name' },
      version: { required: true, label: 'Version' },
      releaseTypeId: { required: true, label: 'Release Type' },
      releaseDate: {
        required: true,
        label: 'Release Date',
        validate: (value: string) => value && (value < projectStartDate || value > projectEndDate)
          ? 'Release Date must be within the project period.'
          : undefined,
      },
      status: { required: true, label: 'Status' },
    }),
    [projectEndDate, projectStartDate],
  )
  const form = useForm<ReleaseFormPayload>({
    initialValues,
    schema,
    requireDirtyToSubmit: mode === 'edit',
  })

  useEffect(() => {
    let active = true
    releaseTypeService
      .getReleaseTypes({ pageNumber: 0, pageSize: 100, sortBy: 'name' })
      .then((result) => {
        if (!active) return
        if (result.success) {
          setReleaseTypes(
            result.data.content
              .filter((item) => item.active || item.id === initialValues.releaseTypeId)
              .map((item) => ({ label: item.name, value: item.id })),
          )
        } else setReleaseTypeError(result.message)
      })
      .catch(() => active && setReleaseTypeError('Unable to load Release Types.'))
    return () => {
      active = false
    }
  }, [initialValues.releaseTypeId])

  const handleSubmit = () => {
    if (!form.validateAll()) return
    onSubmit({
      ...form.values,
      status: mode === 'create' ? 'ON_HOLD' : form.values.status,
      name: form.values.name.trim(),
      version: form.values.version.trim(),
      description: form.values.description.trim(),
    })
  }

  return (
    <>
      <Card title="Release Information" subtitle="Release names and versions must be unique within the selected project.">
        <FormErrorAlert message={submitError} title={`Release could not be ${mode === 'create' ? 'created' : 'updated'}`} />
        <div className="flex flex-col gap-5">
          <FormRow>
            <Input label="Release Name" required value={form.values.name} error={form.touched.name ? form.errors.name : undefined} onChange={(event) => form.setValue('name', event.target.value)} />
            <Input label="Version" required value={form.values.version} error={form.touched.version ? form.errors.version : undefined} onChange={(event) => form.setValue('version', event.target.value)} placeholder="For example: 2.4.0" />
          </FormRow>
          <FormRow>
            <Dropdown label="Release Type" required value={form.values.releaseTypeId} options={releaseTypes} error={(form.touched.releaseTypeId ? form.errors.releaseTypeId : undefined) || releaseTypeError || undefined} onChange={(event) => form.setValue('releaseTypeId', event.target.value)} />
            <Dropdown
              label="Status"
              required
              disabled={mode === 'create' || (mode === 'edit' && !canChangeStatus)}
              value={mode === 'create' ? 'ON_HOLD' : form.values.status}
              options={mode === 'create'
                ? RELEASE_STATUS_OPTIONS.filter((option) => option.value === 'ON_HOLD')
                : RELEASE_STATUS_OPTIONS.filter((option) => form.values.status === 'ACTIVE' || option.value !== 'ACTIVE')}
              error={form.touched.status ? form.errors.status : undefined}
              onChange={(event) => form.setValue('status', event.target.value as ReleaseStatus)}
            />
          </FormRow>
          {mode === 'create' && <p className="-mt-3 text-xs text-ink-500">New Releases are created On Hold. Activate the Release from Release Management when it is ready.</p>}
          <FormRow columns={1}>
            <Input type="date" label="Release Date" required min={projectStartDate} max={projectEndDate} value={form.values.releaseDate} error={form.touched.releaseDate ? form.errors.releaseDate : undefined} onChange={(event) => form.setValue('releaseDate', event.target.value)} />
          </FormRow>
          <FormRow columns={1}>
            <Input label="Description" value={form.values.description} onChange={(event) => form.setValue('description', event.target.value)} placeholder="Optional release scope or notes" />
          </FormRow>
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
        <FormActions
          onCancel={onCancel}
          onSubmit={handleSubmit}
          submitLabel={mode === 'create' ? 'Create Release' : 'Save Changes'}
          isSubmitting={isSubmitting}
          isSubmitDisabled={!form.canSubmit || Boolean(releaseTypeError)}
        />
      </div>
    </>
  )
}
