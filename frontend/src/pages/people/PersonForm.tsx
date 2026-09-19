import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { LabeledSelect } from '@/components/shared/LabeledSelect'
import { parseApiError } from '@/lib/apiErrors'
import { GENDER_OPTIONS, peopleService, type Gender, type Person, type PersonListItem } from '@/services/people'

interface PersonFormProps {
  /** Existing person to edit; omit to create. */
  person?: Pick<Person, 'id' | 'first_name' | 'last_name' | 'date_of_birth' | 'gender'> &
    Partial<Pick<Person, 'middle_name' | 'national_id'>>
  onClose: () => void
  onSaved: (person: Person | PersonListItem) => void
}

interface FormState {
  first_name: string
  middle_name: string
  last_name: string
  date_of_birth: string
  gender: Gender
  national_id: string
}

export const PersonForm: React.FC<PersonFormProps> = ({ person, onClose, onSaved }) => {
  const [form, setForm] = useState<FormState>({
    first_name: person?.first_name ?? '',
    middle_name: person?.middle_name ?? '',
    last_name: person?.last_name ?? '',
    date_of_birth: person?.date_of_birth ?? '',
    gender: person?.gender ?? '',
    national_id: person?.national_id ?? '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim(),
        last_name: form.last_name.trim(),
        date_of_birth: form.date_of_birth || null,
        gender: form.gender,
        national_id: form.national_id.trim(),
      }
      return person ? peopleService.updatePerson(person.id, payload) : peopleService.createPerson(payload)
    },
    onSuccess: (saved) => {
      toast.success(person ? 'Person updated' : 'Person created')
      onSaved(saved)
    },
    onError: (error) => {
      const info = parseApiError(error)
      setFieldErrors(info.fieldErrors)
      setFormError(Object.keys(info.fieldErrors).length ? null : info.message)
    },
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const errors: Record<string, string> = {}
    if (!form.first_name.trim()) errors.first_name = 'First name is required'
    if (!form.last_name.trim()) errors.last_name = 'Last name is required'
    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length === 0) mutation.mutate()
  }

  return (
    <Modal title={person ? 'Edit person' : 'Add person'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <Input label="First name" required value={form.first_name} error={fieldErrors.first_name} onChange={(e) => set('first_name', e.target.value)} />
        <Input label="Middle name" value={form.middle_name} error={fieldErrors.middle_name} onChange={(e) => set('middle_name', e.target.value)} />
        <Input label="Last name" required value={form.last_name} error={fieldErrors.last_name} onChange={(e) => set('last_name', e.target.value)} />
        <Input label="Date of birth" type="date" value={form.date_of_birth} error={fieldErrors.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} />
        <LabeledSelect
          id="person-gender"
          label="Gender"
          value={form.gender}
          placeholder="Not specified"
          options={GENDER_OPTIONS}
          error={fieldErrors.gender}
          onChange={(value) => set('gender', value as Gender)}
        />
        <Input label="National ID" value={form.national_id} error={fieldErrors.national_id} onChange={(e) => set('national_id', e.target.value)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            {person ? 'Save changes' : 'Create person'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
