import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { Dropdown } from '@/components/common/Dropdown'
import { FormRow } from '@/components/forms/FormRow'
import { FormActions } from '@/components/forms/FormActions'
import { Loader } from '@/components/common/Loader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useForm } from '@/hooks/useForm'
import { required, email as emailValidator, phone as phoneValidator, composeValidators } from '@/utils/validation'
import { employeeService } from '@/services/employeeService'
import { mockDesignations } from '@/mock/designations'
import { Employee, UpdateEmployeePayload } from '@/types/employee'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'

export const EmployeeEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<UpdateEmployeePayload>({
    initialValues: {
      firstName: '',
      lastName: '',
      gender: '',
      designationId: '',
      email: '',
      phone: '',
      joinDate: '',
      profileImage: '',
    },
    requireDirtyToSubmit: true,
    schema: {
      firstName: { required: true, label: 'First Name' },
      lastName: { required: true, label: 'Last Name' },
      gender: { required: true, label: 'Gender' },
      designationId: { required: true, label: 'Designation' },
      email: { required: true, label: 'Email Address', validate: composeValidators(required('Email'), emailValidator('Email')) },
      phone: { required: true, label: 'Phone Number', validate: composeValidators(required('Phone'), phoneValidator('Phone')) },
      joinDate: { required: true, label: 'Join Date' },
    },
  })

  const loadEmployee = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setLoadError(null)
    try {
      const result = await employeeService.getEmployeeById(id)
      if (result.success) {
        setEmployee(result.data)
        form.reset({
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          gender: result.data.gender,
          designationId: result.data.designationId,
          email: result.data.email,
          phone: result.data.phone,
          joinDate: result.data.joinDate,
          profileImage: result.data.profileImage || '',
        })
      } else {
        setLoadError(result.message)
      }
    } catch (e) {
      setLoadError('An unexpected error occurred while loading the employee details.')
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    loadEmployee()
  }, [loadEmployee])

  const handleSubmit = async () => {
    if (!id || !form.validateAll()) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await employeeService.updateEmployee(id, form.values as UpdateEmployeePayload)
      if (result.success) {
        toast.success(result.message)
        navigate(ROUTES.EMPLOYEE_DETAIL.replace(':id', id))
      } else {
        setSubmitError(result.message)
      }
    } catch (e) {
      setSubmitError('An unexpected error occurred while updating the employee.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader label="Loading employee data..." /></div>
  }

  if (loadError || !employee) {
    return <div className="py-12"><ErrorMessage message={loadError || 'Employee not found.'} /></div>
  }

  return (
    <div className="mx-auto max-w-4xl">
       <button 
          onClick={() => navigate(ROUTES.EMPLOYEE_DETAIL.replace(':id', employee.id))} 
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Details
        </button>

      <PageHeader
        title="Edit Employee"
        description={`Update information for ${employee.firstName} ${employee.lastName}.`}
      />

      <Card className="p-6">
        {submitError && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-signal-critical">
            {submitError}
          </div>
        )}

        <div className="flex flex-col gap-6">
          <FormRow>
            <Input
              label="First Name"
              name="firstName"
              required
              value={form.values.firstName}
              error={form.touched.firstName ? form.errors.firstName : undefined}
              onChange={(e) => form.setValue('firstName', e.target.value)}
            />
            <Input
              label="Last Name"
              name="lastName"
              required
              value={form.values.lastName}
              error={form.touched.lastName ? form.errors.lastName : undefined}
              onChange={(e) => form.setValue('lastName', e.target.value)}
            />
          </FormRow>
          
          <FormRow>
            <Dropdown
              label="Gender"
              name="gender"
              required
              options={[
                { label: 'Male', value: 'Male' },
                { label: 'Female', value: 'Female' },
              ]}
              value={form.values.gender}
              error={form.touched.gender ? form.errors.gender : undefined}
              onChange={(e) => form.setValue('gender', e.target.value)}
            />
            <Dropdown
              label="Designation"
              name="designationId"
              required
              options={mockDesignations.map((d) => ({ label: d.title, value: d.id }))}
              value={form.values.designationId}
              error={form.touched.designationId ? form.errors.designationId : undefined}
              onChange={(e) => form.setValue('designationId', e.target.value)}
            />
          </FormRow>

          <FormRow>
            <Input
              label="Email Address"
              name="email"
              type="email"
              required
              value={form.values.email}
              error={form.touched.email ? form.errors.email : undefined}
              onChange={(e) => form.setValue('email', e.target.value)}
            />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              required
              value={form.values.phone}
              error={form.touched.phone ? form.errors.phone : undefined}
              onChange={(e) => form.setValue('phone', e.target.value)}
            />
          </FormRow>

          <FormRow>
            <Input
              label="Join Date"
              name="joinDate"
              type="date"
              required
              value={form.values.joinDate}
              error={form.touched.joinDate ? form.errors.joinDate : undefined}
              onChange={(e) => form.setValue('joinDate', e.target.value)}
            />
            <Input
              label="Profile Image"
              name="profileImage"
              type="file"
              accept="image/*"
              error={form.touched.profileImage ? form.errors.profileImage : undefined}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  form.setValue('profileImage', URL.createObjectURL(file))
                }
              }}
              hint="Upload a new profile picture to replace the current one."
            />
          </FormRow>
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm">
        <FormActions
          onCancel={() => navigate(ROUTES.EMPLOYEE_DETAIL.replace(':id', employee.id))}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          isSubmitting={isSubmitting}
          isSubmitDisabled={!form.canSubmit}
        />
      </div>
    </div>
  )
}
