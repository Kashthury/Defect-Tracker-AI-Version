import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { ColorPicker } from '@/components/common/ColorPicker'
import { Loader } from '@/components/common/Loader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { FormRow } from '@/components/forms/FormRow'
import { FormActions } from '@/components/forms/FormActions'
import { useForm } from '@/hooks/useForm'
import { severityService } from '@/services/severityService'
import { SeverityConfig } from '@/types/defect'
import { UpdateSeverityPayload } from '@/types/severity'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'

export const SeverityEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [severity, setSeverity] = useState<SeverityConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<UpdateSeverityPayload>({
    initialValues: { name: '', description: '', weight: 1, color: '#C13B3B' },
    requireDirtyToSubmit: true,
    schema: {
      name: { required: true, label: 'Severity Name' },
      weight: {
        required: true,
        label: 'Weight',
        validate: (value) => Number.isFinite(value) && value >= 1
          ? undefined
          : 'Weight must be a number greater than or equal to 1.',
      },
    },
  })

  const loadSeverity = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = await severityService.getSeverityById(id)
      if (result.success) {
        setSeverity(result.data)
        form.reset({
          name: result.data.name,
          description: result.data.description,
          weight: result.data.weight,
          color: result.data.color,
        })
      } else {
        setLoadError(result.message)
      }
    } catch {
      setLoadError('An unexpected error occurred while loading the severity.')
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    loadSeverity()
  }, [loadSeverity])

  const handleSubmit = async () => {
    if (!id || !form.validateAll()) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await severityService.updateSeverity(id, form.values)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.SEVERITY)
      } else {
        setSubmitError(result.message)
      }
    } catch {
      setSubmitError('An unexpected error occurred while updating the severity.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader label="Loading severity..." />
      </div>
    )
  }

  if (loadError || !severity) {
    return (
      <div className="py-12">
        <ErrorMessage message={loadError || 'Severity not found.'} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => navigate(ROUTES.SEVERITY)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Severities
      </button>

      <PageHeader title="Update Severity" description={`Update the ${severity.name} severity.`} />

      <Card title="Severity Information" subtitle="Weight changes affect the dashboard severity defect index.">
        {submitError && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-signal-critical">{submitError}</div>
        )}

        <div className="flex flex-col gap-6">
          <FormRow columns={1}>
            <Input
              label="Severity Name"
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
              error={form.touched.description ? form.errors.description : undefined}
              onChange={(event) => form.setValue('description', event.target.value)}
            />
          </FormRow>
          <FormRow columns={1}>
            <Input
              label="Weight"
              name="weight"
              type="number"
              min={1}
              step={1}
              required
              value={form.values.weight}
              error={form.touched.weight ? form.errors.weight : undefined}
              onChange={(event) => form.setValue('weight', Number(event.target.value))}
              hint="Higher weight increases the dashboard severity defect index."
            />
          </FormRow>
          <FormRow columns={1}>
            <ColorPicker
              label="Color"
              required
              value={form.values.color}
              onChange={(hex) => form.setValue('color', hex)}
              hint="Used to visually tag this severity across the app."
            />
          </FormRow>
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
        <FormActions
          onCancel={() => navigate(ROUTES.SEVERITY)}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          isSubmitting={isSubmitting}
          isSubmitDisabled={!form.canSubmit}
        />
      </div>
    </div>
  )
}
