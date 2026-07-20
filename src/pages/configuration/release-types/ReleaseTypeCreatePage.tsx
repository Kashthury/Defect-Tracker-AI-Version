import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { FormRow } from '@/components/forms/FormRow'
import { FormActions } from '@/components/forms/FormActions'
import { useForm } from '@/hooks/useForm'
import { releaseTypeService } from '@/services/releaseTypeService'
import { CreateReleaseTypePayload } from '@/types/releaseType'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'

export const ReleaseTypeCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<CreateReleaseTypePayload>({
    initialValues: { name: '', description: '' },
    schema: {
      name: { required: true, label: 'Release Type Name' },
    },
  })

  const handleSubmit = async () => {
    if (!form.validateAll()) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await releaseTypeService.createReleaseType(form.values)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.RELEASE_TYPE)
      } else {
        setSubmitError(result.message)
      }
    } catch {
      setSubmitError('An unexpected error occurred while creating the release type.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => navigate(ROUTES.RELEASE_TYPE)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Release Types
      </button>

      <PageHeader
        title="Create Release Type"
        description="Add a new category used to classify releases."
      />

      <Card title="Release Type Information" subtitle="Release Type Name must be unique.">
        {submitError && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-signal-critical">{submitError}</div>
        )}

        <div className="flex flex-col gap-6">
          <FormRow columns={1}>
            <Input
              label="Release Type Name"
              name="name"
              required
              value={form.values.name}
              error={form.touched.name ? form.errors.name : undefined}
              onChange={(event) => form.setValue('name', event.target.value)}
              hint="For example: Major, Minor, Patch, Hotfix."
            />
          </FormRow>
          <FormRow columns={1}>
            <Input
              label="Description"
              name="description"
              value={form.values.description}
              error={form.touched.description ? form.errors.description : undefined}
              onChange={(event) => form.setValue('description', event.target.value)}
              hint="Optional short description of what this release type covers."
            />
          </FormRow>
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
        <FormActions
          onCancel={() => navigate(ROUTES.RELEASE_TYPE)}
          onSubmit={handleSubmit}
          submitLabel="Create Release Type"
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
