import React, { useEffect, useRef, useState } from 'react'
import { ImagePlus, Paperclip, Trash2 } from 'lucide-react'
import { Button } from '@/components/common/Button'

const MAX_SIZE = 5 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface ImageAttachmentUploadProps {
  file: File | null
  existingName?: string
  disabled?: boolean
  onChange: (file: File) => void
  onRemove: () => void
}

export const ImageAttachmentUpload: React.FC<ImageAttachmentUploadProps> = ({ file, existingName, disabled, onChange, onRemove }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!file) { setPreview(undefined); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const select = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (!selected) return
    if (!TYPES.includes(selected.type)) { setError('Select a JPG, PNG, or WebP image.'); return }
    if (selected.size > MAX_SIZE) { setError('Attachment image must be 5 MB or smaller.'); return }
    setError(undefined)
    onChange(selected)
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">Attachment Image</label>
      <div className="flex min-h-28 items-center gap-4 rounded-xl border border-ink-200 bg-ink-50/60 p-4">
        {preview ? <img src={preview} alt="Defect attachment preview" className="h-24 w-24 rounded-lg border border-white object-cover shadow-sm" /> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-400"><ImagePlus className="h-7 w-7" /></div>}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-800">{file?.name || existingName || 'No image selected'}</p>
          <p className="mt-1 text-xs text-ink-500">JPG, PNG, or WebP. Maximum 5 MB.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={disabled} leftIcon={<Paperclip className="h-4 w-4" />} onClick={() => inputRef.current?.click()}>{file || existingName ? 'Replace Image' : 'Choose Image'}</Button>
            {(file || existingName) && <Button type="button" size="sm" variant="ghost" disabled={disabled} leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => { setError(undefined); onRemove() }}>Remove</Button>}
          </div>
        </div>
        <input ref={inputRef} type="file" className="sr-only" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" disabled={disabled} onChange={select} />
      </div>
      {error && <p role="alert" className="mt-1.5 text-xs text-signal-critical">{error}</p>}
    </div>
  )
}
