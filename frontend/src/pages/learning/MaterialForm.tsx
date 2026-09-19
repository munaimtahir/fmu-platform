import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { FileUpload } from '@/components/ui/FileUpload'
import { LabeledSelect } from '@/components/shared/LabeledSelect'
import { parseApiError } from '@/lib/apiErrors'
import { fileNameFromUrl } from '@/lib/mediaUrl'
import { isSafeExternalUrl, learningService, type LearningMaterial, type MaterialKind } from '@/services/learning'

const MAX_FILE_BYTES = 25 * 1024 * 1024

/** ISO string -> value for <input type="datetime-local"> in the user's timezone. */
export function toLocalInput(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const toIso = (value: string): string | null => (value ? new Date(value).toISOString() : null)

interface MaterialFormProps {
  material?: LearningMaterial
  onClose: () => void
}

export const MaterialForm: React.FC<MaterialFormProps> = ({ material, onClose }) => {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(material?.title ?? '')
  const [description, setDescription] = useState(material?.description ?? '')
  const [kind, setKind] = useState<MaterialKind>(material?.kind ?? 'LINK')
  const [url, setUrl] = useState(material?.url ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [availableFrom, setAvailableFrom] = useState(toLocalInput(material?.available_from))
  const [availableUntil, setAvailableUntil] = useState(toLocalInput(material?.available_until))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const common = {
        title: title.trim(),
        description: description.trim(),
        kind,
        available_from: toIso(availableFrom),
        available_until: toIso(availableUntil),
      }
      if (material) {
        // Editing a FILE material without choosing a new file must leave the stored file alone.
        return learningService.updateMaterial(material.id, kind === 'LINK' ? { ...common, url: url.trim() } : file ? { ...common, file } : common)
      }
      return learningService.createMaterial(kind === 'LINK' ? { ...common, url: url.trim() } : { ...common, file })
    },
    onSuccess: () => {
      toast.success(material ? 'Material updated' : 'Material created as a draft')
      queryClient.invalidateQueries({ queryKey: ['learning-materials'] })
      onClose()
    },
    onError: (err) => {
      const info = parseApiError(err)
      setFieldErrors(info.fieldErrors)
      setFormError(Object.keys(info.fieldErrors).length ? null : info.message)
    },
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const errors: Record<string, string> = {}
    if (!title.trim()) errors.title = 'A title is required'
    if (kind === 'LINK') {
      if (!url.trim()) errors.url = 'A link is required'
      else if (!isSafeExternalUrl(url.trim())) errors.url = 'Enter a full http:// or https:// address'
    }
    if (kind === 'FILE' && !file && !material?.file) errors.file = 'Choose a file to upload'
    if (availableFrom && availableUntil && new Date(availableUntil) <= new Date(availableFrom)) {
      errors.available_until = 'Must be after the start of availability'
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length === 0) mutation.mutate()
  }

  return (
    <Modal title={material ? 'Edit material' : 'New learning material'} onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <Input label="Title" required value={title} error={fieldErrors.title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
        <TextArea id="material-description" label="Description" value={description} error={fieldErrors.description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        <LabeledSelect
          id="material-kind"
          label="Type"
          value={kind}
          disabled={!!material}
          options={[
            { value: 'LINK', label: 'Link' },
            { value: 'FILE', label: 'File' },
          ]}
          error={fieldErrors.kind}
          onChange={(value) => setKind(value as MaterialKind)}
        />
        {kind === 'LINK' ? (
          <Input label="Link" type="url" required value={url} error={fieldErrors.url} placeholder="https://" onChange={(e) => setUrl(e.target.value)} />
        ) : (
          <FileUpload
            id="material-file"
            label={material?.file ? `File (current: ${fileNameFromUrl(material.file)})` : 'File'}
            required={!material?.file}
            maxSize={MAX_FILE_BYTES}
            error={fieldErrors.file}
            onChange={(files) => setFile(files?.[0] ?? null)}
          />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Available from" type="datetime-local" value={availableFrom} error={fieldErrors.available_from} onChange={(e) => setAvailableFrom(e.target.value)} helperText="Leave empty to show as soon as it is published." />
          <Input label="Available until" type="datetime-local" value={availableUntil} error={fieldErrors.available_until} onChange={(e) => setAvailableUntil(e.target.value)} helperText="Leave empty for no expiry." />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            {material ? 'Save changes' : 'Create draft'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
