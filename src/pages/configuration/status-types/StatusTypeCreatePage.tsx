import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { ColorPicker, DEFAULT_COLOR_PRESETS } from '@/components/common/ColorPicker'
import { Dropdown } from '@/components/common/Dropdown'
import { Input } from '@/components/common/Input'
import { Loader } from '@/components/common/Loader'
import { FormActions } from '@/components/forms/FormActions'
import { FormRow } from '@/components/forms/FormRow'
import { PageHeader } from '@/components/layout/PageHeader'
import { STATUS_TYPE_CODE_OPTIONS } from '@/constants/statusTypes'
import { ROUTES } from '@/constants/routes'
import { useToast } from '@/context/ToastContext'
import { useForm } from '@/hooks/useForm'
import { statusTypeService } from '@/services/statusTypeService'
import { SelectOption } from '@/types/common'
import { CreateStatusTypePayload } from '@/types/statusType'

const validHexColor = (value: string) =>
  /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? undefined : 'Display Color must be a valid hex color.'

export const StatusTypeCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [availableOptions, setAvailableOptions] = useState<SelectOption[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<CreateStatusTypePayload>({
    initialValues: { code: '', name: '', color: DEFAULT_COLOR_PRESETS[4] },
    schema: {
      code: { required: true, label: 'Enum Code' },
      name: { required: true, label: 'Status Name' },
      color: { required: true, label: 'Display Color', validate: validHexColor },
    },
  })

  useEffect(() => {
    let active = true

    statusTypeService
      .getStatusTypes({ pageNumber: 0, pageSize: 100 })
      .then((result) => {
        if (!active) return
        if (result.success) {
          const configuredCodes = new Set<string>(result.data.content.map((status) => status.code))
          setAvailableOptions(
            STATUS_TYPE_CODE_OPTIONS.filter((option) => !configuredCodes.has(option.value)),
          )
        } else {
          setOptionsError(result.message)
        }
      })
      .catch(() => {
        if (active) setOptionsError('Unable to load available enum codes.')
      })
      .finally(() => {
        if (active) setIsLoadingOptions(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async () => {
    if (!form.validateAll()) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await statusTypeService.createStatusType(form.values)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.STATUS_TYPE)
      } else {
        setSubmitError(result.message)
      }
    } catch {
      setSubmitError('An unexpected error occurred while creating the status type.')
    } finally {
      setIsSubmitting(false)
    }
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

      <PageHeader
        title="Create Status Type"
        description="Select an approved enum code, then define its user-facing name and color."
      />

      <Card
        title="Status Type Information"
        subtitle="Enum codes are controlled identifiers; Status Name is the label users see."
      >
        {(submitError || optionsError) && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-signal-critical">
            {submitError || optionsError}
          </div>
        )}

        {isLoadingOptions ? (
          <div className="flex h-32 items-center justify-center">
            <Loader label="Loading enum codes..." />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <FormRow>
              <Dropdown
                label="Enum Code"
                name="code"
                required
                options={availableOptions}
                value={form.values.code}
                error={form.touched.code ? form.errors.code : undefined}
                onChange={(event) => form.setValue('code', event.target.value)}
                placeholder={
                  availableOptions.length > 0 ? 'Select enum code...' : 'All enum codes configured'
                }
                disabled={availableOptions.length === 0}
              />
              <Input
                label="Status Name"
                name="name"
                required
                value={form.values.name}
                error={form.touched.name ? form.errors.name : undefined}
                onChange={(event) => form.setValue('name', event.target.value)}
                placeholder="Enter display name"
                hint="For example: In Progress."
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
        )}
      </Card>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
        <FormActions
          onCancel={() => navigate(ROUTES.STATUS_TYPE)}
          onSubmit={handleSubmit}
          submitLabel="Create Status Type"
          isSubmitting={isSubmitting}
          isSubmitDisabled={isLoadingOptions || !!optionsError || availableOptions.length === 0}
        />
      </div>
    </div>
  )
}
