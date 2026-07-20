import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { FormRow } from '@/components/forms/FormRow'
import { FormActions } from '@/components/forms/FormActions'
import { useForm } from '@/hooks/useForm'
import { designationService } from '@/services/designationService'
import { CreateDesignationPayload } from '@/types/designation'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'

export const DesignationCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<CreateDesignationPayload>({
    initialValues: { title: '' },
    schema: {
      title: { required: true, label: 'Designation Name' },
    },
  })

  const handleSubmit = async () => {
    if (!form.validateAll()) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await designationService.createDesignation(form.values)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.DESIGNATIONS)
      } else {
        // Surface uniqueness / server validation on the field and as a banner.
        setSubmitError(result.message)
        form.setValue('title', form.values.title)
      }
    } catch {
      setSubmitError('An unexpected error occurred while creating the designation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => navigate(ROUTES.DESIGNATIONS)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Designations
      </button>

      <PageHeader
        title="Create Designation"
        description="Add a new job title that can be assigned to employees."
      />

      <Card>
        {submitError && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-signal-critical">{submitError}</div>
        )}

        <FormRow columns={1}>
          <Input
            label="Designation Name"
            name="title"
            required
            value={form.values.title}
            error={form.touched.title ? form.errors.title : undefined}
            onChange={(event) => form.setValue('title', event.target.value)}
            hint="For example: QA Engineer, Business Analyst."
          />
        </FormRow>
      </Card>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
        <FormActions
          onCancel={() => navigate(ROUTES.DESIGNATIONS)}
          onSubmit={handleSubmit}
          submitLabel="Create Designation"
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
