import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { ColorPicker } from '@/components/common/ColorPicker'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Input } from '@/components/common/Input'
import { Loader } from '@/components/common/Loader'
import { FormActions } from '@/components/forms/FormActions'
import { FormRow } from '@/components/forms/FormRow'
import { PageHeader } from '@/components/layout/PageHeader'
import { ROUTES } from '@/constants/routes'
import { useToast } from '@/context/ToastContext'
import { useForm } from '@/hooks/useForm'
import { statusTypeService } from '@/services/statusTypeService'
import { StatusTypeRecord, UpdateStatusTypePayload } from '@/types/statusType'

const validHexColor = (value: string) =>
  /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? undefined : 'Display Color must be a valid hex color.'

export const StatusTypeEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [statusType, setStatusType] = useState<StatusTypeRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<UpdateStatusTypePayload>({
    initialValues: { name: '', color: '#3E6FBF' },
    requireDirtyToSubmit: true,
    schema: {
      name: { required: true, label: 'Status Name' },
      color: { required: true, label: 'Display Color', validate: validHexColor },
    },
  })

  const loadStatusType = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = await statusTypeService.getStatusTypeById(id)
      if (result.success) {
        setStatusType(result.data)
        form.reset({ name: result.data.name, color: result.data.color })
      } else {
        setLoadError(result.message)
      }
    } catch {
      setLoadError('An unexpected error occurred while loading the status type.')
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    loadStatusType()
  }, [loadStatusType])

  const handleSubmit = async () => {
    if (!id || !form.validateAll()) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await statusTypeService.updateStatusType(id, form.values)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.STATUS_TYPE)
      } else {
        setSubmitError(result.message)
      }
    } catch {
      setSubmitError('An unexpected error occurred while updating the status type.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader label="Loading status type..." />
      </div>
    )
  }

  if (loadError || !statusType) {
    return (
      <div className="py-12">
        <ErrorMessage message={loadError || 'Status type not found.'} onRetry={loadStatusType} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => navigate(ROUTES.STATUS_TYPE)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Status Types
      </button>

      <PageHeader title="Update Status Type" description={`Update the ${statusType.name} status.`} />

      <Card
        title="Status Type Information"
        subtitle="The enum code is immutable so existing records and workflows keep a stable identifier."
      >
        {submitError && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-signal-critical">
            {submitError}
          </div>
        )}

        <div className="flex flex-col gap-6">
          <FormRow columns={1}>
            <Input label="Enum Code" value={statusType.code} disabled />
          </FormRow>
          <FormRow columns={1}>
            <Input
              label="Status Name"
              name="name"
              required
              value={form.values.name}
              error={form.touched.name ? form.errors.name : undefined}
              onChange={(event) => form.setValue('name', event.target.value)}
            />
          </FormRow>
          <FormRow columns={1}>
            <ColorPicker
              label="Display Color"
              required
              value={form.values.color}
              error={form.touched.color ? form.errors.color : undefined}
              onChange={(hex) => form.setValue('color', hex)}
              hint="Used for status badges, workflows, cards, and status displays."
            />
          </FormRow>
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
        <FormActions
          onCancel={() => navigate(ROUTES.STATUS_TYPE)}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          isSubmitting={isSubmitting}
          isSubmitDisabled={!form.canSubmit}
        />
      </div>
    </div>
  )
}

