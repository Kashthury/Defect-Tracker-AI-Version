import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { Dropdown } from '@/components/common/Dropdown'
import { Button } from '@/components/common/Button'
import { FormRow } from '@/components/forms/FormRow'
import { FormActions } from '@/components/forms/FormActions'
import { useForm } from '@/hooks/useForm'
import { required, email as emailValidator, phone as phoneValidator, composeValidators } from '@/utils/validation'
import { employeeService } from '@/services/employeeService'
import { designationService } from '@/services/designationService'
import { Gender } from '@/types/employee'
import { useToast } from '@/context/ToastContext'
import { ROUTES } from '@/constants/routes'

interface EmployeeFormValues {
  firstName: string; lastName: string; gender: Gender | ''; designationId: string
  email: string; phoneNo: string; joinDate: string; profileImage: string
}

const genderOptions = [
  { label: 'Male', value: 'MALE' }, { label: 'Female', value: 'FEMALE' }, { label: 'Other', value: 'OTHER' },
]

export const EmployeeCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [emailServerError, setEmailServerError] = useState('')
  const [designations, setDesignations] = useState<{ label: string; value: string }[]>([])

  const form = useForm<EmployeeFormValues>({
    initialValues: { firstName: '', lastName: '', gender: '', designationId: '', email: '', phoneNo: '', joinDate: new Date().toISOString().slice(0, 10), profileImage: '' },
    schema: {
      firstName: { required: true, label: 'First Name' }, lastName: { required: true, label: 'Last Name' },
      gender: { required: true, label: 'Gender' }, designationId: { required: true, label: 'Designation' },
      email: { required: true, label: 'Email Address', validate: composeValidators(required('Email'), emailValidator('Email')) },
      phoneNo: { required: true, label: 'Phone Number', validate: composeValidators(required('Phone'), phoneValidator('Phone')) },
      joinDate: { required: true, label: 'Join Date', validate: (value) => value > new Date().toISOString().slice(0, 10) ? 'Join Date cannot be in the future.' : undefined },
    },
  })

  useEffect(() => {
    designationService.getDesignations({ pageNumber: 0, pageSize: 100, sortBy: 'title', sortDir: 'asc', filters: { active: true } })
      .then((result) => result.success && setDesignations(result.data.content.filter((item) => item.active !== false).map((item) => ({ label: item.title, value: item.id }))))
  }, [])

  const handleSubmit = async () => {
    if (!form.validateAll() || isSubmitting) return
    setIsSubmitting(true); setGlobalError(null); setEmailServerError('')
    const result = await employeeService.createEmployee({
      firstName: form.values.firstName.trim(), lastName: form.values.lastName.trim(), gender: form.values.gender as Gender,
      email: form.values.email.trim().toLowerCase(), phoneNo: form.values.phoneNo.trim(), joinDate: form.values.joinDate,
      designationId: Number(form.values.designationId), profileImage: form.values.profileImage.trim() || null,
    })
    setIsSubmitting(false)
    if (!result.success) {
      if (result.message.toLowerCase().includes('email')) setEmailServerError(result.message)
      else setGlobalError(result.message)
      return
    }
    toast.success(result.message); navigate(ROUTES.EMPLOYEES)
  }

  return <div className="mx-auto max-w-4xl">
    <PageHeader title="Add New Employee" description="Create an employee profile. Employee code and active status are managed by the backend." />
    <Card className="p-6">
      {globalError && <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-signal-critical">{globalError}</div>}
      <div className="flex flex-col gap-6">
        <FormRow><Input label="First Name" required value={form.values.firstName} error={form.touched.firstName ? form.errors.firstName : undefined} onChange={(e) => form.setValue('firstName', e.target.value)} /><Input label="Last Name" required value={form.values.lastName} error={form.touched.lastName ? form.errors.lastName : undefined} onChange={(e) => form.setValue('lastName', e.target.value)} /></FormRow>
        <FormRow><Dropdown label="Gender" required options={genderOptions} value={form.values.gender} error={form.touched.gender ? form.errors.gender : undefined} onChange={(e) => form.setValue('gender', e.target.value)} /><Dropdown label="Designation" required options={designations} value={form.values.designationId} error={form.touched.designationId ? form.errors.designationId : undefined} onChange={(e) => form.setValue('designationId', e.target.value)} /></FormRow>
        <FormRow><Input label="Email Address" type="email" required value={form.values.email} error={emailServerError || (form.touched.email ? form.errors.email : undefined)} onChange={(e) => { form.setValue('email', e.target.value); setEmailServerError('') }} /><Input label="Phone Number" type="tel" required value={form.values.phoneNo} error={form.touched.phoneNo ? form.errors.phoneNo : undefined} onChange={(e) => form.setValue('phoneNo', e.target.value)} /></FormRow>
        <FormRow><Input label="Join Date" type="date" required max={new Date().toISOString().slice(0, 10)} value={form.values.joinDate} error={form.touched.joinDate ? form.errors.joinDate : undefined} onChange={(e) => form.setValue('joinDate', e.target.value)} /><Input label="Profile Image URL" value={form.values.profileImage} onChange={(e) => form.setValue('profileImage', e.target.value)} hint="Optional URL or uploaded-image path." /></FormRow>
        {form.values.profileImage && <div className="flex items-center gap-3"><img src={form.values.profileImage} alt="Profile preview" className="h-16 w-16 rounded-full object-cover" /><Button size="sm" variant="ghost" onClick={() => form.setValue('profileImage', '')}>Remove image</Button></div>}
      </div>
    </Card>
    <div className="sticky bottom-0 z-10 mt-6 rounded-lg border border-ink-200 bg-ink-50 p-4 shadow-sm"><FormActions onCancel={() => navigate(ROUTES.EMPLOYEES)} onSubmit={handleSubmit} submitLabel="Create Employee" isSubmitting={isSubmitting} /></div>
  </div>
}
