import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { Loader } from '@/components/common/Loader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { FormRow } from '@/components/forms/FormRow'
import { FormActions } from '@/components/forms/FormActions'
import { useForm } from '@/hooks/useForm'
import { designationService } from '@/services/designationService'
import { Designation } from '@/types/auth'
import { UpdateDesignationPayload } from '@/types/designation'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'

export const DesignationEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [designation, setDesignation] = useState<Designation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<UpdateDesignationPayload>({
    initialValues: { title: '' },
    requireDirtyToSubmit: true,
    schema: {
      title: { required: true, label: 'Designation Name' },
    },
  })

  const loadDesignation = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = await designationService.getDesignationById(id)
      if (result.success) {
        setDesignation(result.data)
        form.reset({ title: result.data.title })
      } else {
        setLoadError(result.message)
      }
    } catch {
      setLoadError('An unexpected error occurred while loading the designation.')
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    loadDesignation()
  }, [loadDesignation])

  const handleSubmit = async () => {
    if (!id || !form.validateAll()) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await designationService.updateDesignation(id, form.values)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.DESIGNATIONS)
      } else {
        setSubmitError(result.message)
      }
    } catch {
      setSubmitError('An unexpected error occurred while updating the designation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader label="Loading designation..." />
      </div>
    )
  }

  if (loadError || !designation) {
    return (
      <div className="py-12">
        <ErrorMessage message={loadError || 'Designation not found.'} />
      </div>
    )
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

      <PageHeader title="Update Designation" description={`Update the ${designation.title} designation.`} />

      <Card title="Designation Information" subtitle="Designation Name must be unique.">
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
          />
        </FormRow>
      </Card>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
        <FormActions
          onCancel={() => navigate(ROUTES.DESIGNATIONS)}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          isSubmitting={isSubmitting}
          isSubmitDisabled={!form.canSubmit}
        />
      </div>
    </div>
  )
}
