import React, { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, UserRound } from 'lucide-react'
import { Button } from '@/components/common/Button'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface ProfileImageUploadProps {
  file: File | null
  existingImage?: string | null
  removed?: boolean
  disabled?: boolean
  onChange: (file: File | null) => void
  onRemove: () => void
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  file,
  existingImage,
  removed = false,
  disabled,
  onChange,
  onRemove,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (!selected) return
    if (!ACCEPTED_IMAGE_TYPES.includes(selected.type)) {
      setError('Select a JPG, PNG, or WebP image.')
      return
    }
    if (selected.size > MAX_IMAGE_SIZE) {
      setError('Profile image must be 5 MB or smaller.')
      return
    }
    setError(undefined)
    onChange(selected)
  }

  const imageSource = preview || (!removed ? existingImage : null)

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">Profile Image</label>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-ink-200 bg-ink-50/60 p-4">
        {imageSource ? (
          <img src={imageSource} alt="Profile preview" className="h-20 w-20 rounded-full border border-white object-cover shadow-sm" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-100 text-ink-400"><UserRound className="h-8 w-8" /></div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-800">{file?.name || (imageSource ? 'Current profile image' : 'No image selected')}</p>
          <p className="mt-1 text-xs text-ink-500">JPG, PNG, or WebP. Maximum file size: 5 MB.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={disabled} leftIcon={<ImagePlus className="h-4 w-4" />} onClick={() => inputRef.current?.click()}>
              {imageSource ? 'Replace Image' : 'Upload Image'}
            </Button>
            {imageSource && <Button type="button" size="sm" variant="ghost" disabled={disabled} leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => { setError(undefined); onRemove() }}>Remove</Button>}
          </div>
        </div>
        <input ref={inputRef} className="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={selectFile} disabled={disabled} />
      </div>
      {error && <p role="alert" className="mt-1.5 text-xs text-signal-critical">{error}</p>}
    </div>
  )
}
