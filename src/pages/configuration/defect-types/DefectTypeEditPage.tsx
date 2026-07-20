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
import { defectTypeService } from '@/services/defectTypeService'
import { DefectTypeConfig } from '@/types/defect'
import { UpdateDefectTypePayload } from '@/types/defectType'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'

export const DefectTypeEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [defectType, setDefectType] = useState<DefectTypeConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<UpdateDefectTypePayload>({
    initialValues: { name: '', description: '' },
    requireDirtyToSubmit: true,
    schema: {
      name: { required: true, label: 'Defect Type Name' },
    },
  })

  const loadDefectType = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = await defectTypeService.getDefectTypeById(id)
      if (result.success) {
        setDefectType(result.data)
        form.reset({ name: result.data.name, description: result.data.description })
      } else {
        setLoadError(result.message)
      }
    } catch {
      setLoadError('An unexpected error occurred while loading the defect type.')
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    loadDefectType()
  }, [loadDefectType])

  const handleSubmit = async () => {
    if (!id || !form.validateAll()) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await defectTypeService.updateDefectType(id, form.values)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.DEFECT_TYPE)
      } else {
        setSubmitError(result.message)
      }
    } catch {
      setSubmitError('An unexpected error occurred while updating the defect type.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader label="Loading defect type..." />
      </div>
    )
  }

  if (loadError || !defectType) {
    return (
      <div className="py-12">
        <ErrorMessage message={loadError || 'Defect type not found.'} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => navigate(ROUTES.DEFECT_TYPE)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Defect Types
      </button>

      <PageHeader title="Update Defect Type" description={`Update the ${defectType.name} defect type.`} />

      <Card title="Defect Type Information" subtitle="Defect Type Name must be unique.">
        {submitError && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-signal-critical">{submitError}</div>
        )}

        <div className="flex flex-col gap-6">
          <FormRow columns={1}>
            <Input
              label="Defect Type Name"
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
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
        <FormActions
          onCancel={() => navigate(ROUTES.DEFECT_TYPE)}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          isSubmitting={isSubmitting}
          isSubmitDisabled={!form.canSubmit}
        />
      </div>
    </div>
  )
}
