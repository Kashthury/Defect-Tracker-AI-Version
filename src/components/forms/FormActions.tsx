import React from 'react'
import { Button } from '@/components/common/Button'

interface FormActionsProps {
  onCancel: () => void
  onSubmit: () => void
  submitLabel?: string
  isSubmitting?: boolean
  isSubmitDisabled?: boolean
}

/**
 * Standard Cancel / Submit footer. For edit forms, pass isSubmitDisabled
 * from useForm's `canSubmit` (which stays false until the form is dirty
 * and valid) so the Update button is disabled until a real change is made.
 */
export const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  onSubmit,
  submitLabel = 'Save',
  isSubmitting = false,
  isSubmitDisabled = false,
}) => {
  return (
    <>
      <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button onClick={onSubmit} isLoading={isSubmitting} disabled={isSubmitDisabled}>
        {submitLabel}
      </Button>
    </>
  )
}
