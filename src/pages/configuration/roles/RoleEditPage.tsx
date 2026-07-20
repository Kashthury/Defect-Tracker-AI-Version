import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { Dropdown } from '@/components/common/Dropdown'
import { Loader } from '@/components/common/Loader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { FormRow } from '@/components/forms/FormRow'
import { FormActions } from '@/components/forms/FormActions'
import { useForm } from '@/hooks/useForm'
import { ROLE_TYPE_OPTIONS } from '@/constants/roleTypes'
import { roleService } from '@/services/roleService'
import { RoleDetails, UpdateRolePayload } from '@/types/role'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

export const RoleEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [role, setRole] = useState<RoleDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<UpdateRolePayload>({
    initialValues: {
      name: '',
      roleType: '',
      description: '',
      status: 'ACTIVE',
    },
    requireDirtyToSubmit: true,
    schema: {
      name: { required: true, label: 'Role Name' },
      roleType: { required: true, label: 'Role Type' },
      status: { required: true, label: 'Status' },
    },
  })

  const loadRole = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = await roleService.getRoleById(id)
      if (result.success) {
        setRole(result.data)
        form.reset({
          name: result.data.name,
          roleType: result.data.roleType,
          description: result.data.description,
          status: result.data.status,
        })
      } else {
        setLoadError(result.message)
      }
    } catch {
      setLoadError('An unexpected error occurred while loading the role.')
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    loadRole()
  }, [loadRole])

  const handleSubmit = async () => {
    if (!id || !form.validateAll()) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await roleService.updateRole(id, form.values)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.ROLE_DETAIL.replace(':id', id))
      } else {
        setSubmitError(result.message)
      }
    } catch {
      setSubmitError('An unexpected error occurred while updating the role.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader label="Loading role data..." /></div>
  }

  if (loadError || !role) {
    return <div className="py-12"><ErrorMessage message={loadError || 'Role not found.'} /></div>
  }

  return (
    <div className="mx-auto max-w-4xl">
      <button
        onClick={() => navigate(ROUTES.ROLE_DETAIL.replace(':id', role.id))}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Details
      </button>

      <PageHeader title="Update Role" description={`Update ${role.name} role settings.`} />

      <Card title="Role Information" subtitle="Changes affect future role usage and classification filters.">
        {submitError && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-signal-critical">
            {submitError}
          </div>
        )}

        <div className="flex flex-col gap-6">
          <FormRow>
            <Input
              label="Role Name"
              name="name"
              required
              value={form.values.name}
              error={form.touched.name ? form.errors.name : undefined}
              onChange={(event) => form.setValue('name', event.target.value)}
            />
            <Dropdown
              label="Role Type"
              name="roleType"
              required
              options={ROLE_TYPE_OPTIONS}
              value={form.values.roleType}
              error={form.touched.roleType ? form.errors.roleType : undefined}
              onChange={(event) => form.setValue('roleType', event.target.value)}
            />
          </FormRow>

          <FormRow>
            <Dropdown
              label="Status"
              name="status"
              required
              options={STATUS_OPTIONS}
              value={form.values.status}
              error={form.touched.status ? form.errors.status : undefined}
              onChange={(event) => form.setValue('status', event.target.value)}
            />
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
          onCancel={() => navigate(ROUTES.ROLE_DETAIL.replace(':id', role.id))}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          isSubmitting={isSubmitting}
          isSubmitDisabled={!form.canSubmit}
        />
      </div>
    </div>
  )
}
