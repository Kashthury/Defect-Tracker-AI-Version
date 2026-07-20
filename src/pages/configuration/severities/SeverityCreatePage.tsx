import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { ColorPicker, DEFAULT_COLOR_PRESETS } from '@/components/common/ColorPicker'
import { FormRow } from '@/components/forms/FormRow'
import { FormActions } from '@/components/forms/FormActions'
import { useForm } from '@/hooks/useForm'
import { severityService } from '@/services/severityService'
import { CreateSeverityPayload } from '@/types/severity'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'

export const SeverityCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<CreateSeverityPayload>({
    initialValues: { name: '', description: '', weight: 10, color: DEFAULT_COLOR_PRESETS[0] },
    schema: {
      name: { required: true, label: 'Severity Name' },
      weight: { required: true, label: 'Weight' },
    },
  })

  const handleSubmit = async () => {
    if (!form.validateAll()) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await severityService.createSeverity(form.values)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.SEVERITY)
      } else {
        setSubmitError(result.message)
      }
    } catch {
      setSubmitError('An unexpected error occurred while creating the severity.')
    } finally {
      setIsSubmitting(false)
    }
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

      <PageHeader title="Create Severity" description="Add a new severity level used to indicate defect impact." />

      <Card title="Severity Information" subtitle="Severity Name must be unique. Weight is used by the dashboard defect index.">
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
              hint="For example: Critical, High, Medium, Low."
            />
          </FormRow>
          <FormRow columns={1}>
            <Input
              label="Description"
              name="description"
              value={form.values.description}
              error={form.touched.description ? form.errors.description : undefined}
              onChange={(event) => form.setValue('description', event.target.value)}
              hint="Optional short description of this severity level."
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
          submitLabel="Create Severity"
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
