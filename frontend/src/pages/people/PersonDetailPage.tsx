import React, { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/shared/PageShell'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { apiErrorMessage } from '@/lib/apiErrors'
import { peopleService } from '@/services/people'
import { PersonForm } from './PersonForm'
import { AddressesSection, ContactInfoSection, IdentityDocumentsSection } from './PersonSections'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

export const PersonDetailPage: React.FC = () => {
  const { id } = useParams()
  const personId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const photoInput = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false)

  const { data: person, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['person', personId],
    queryFn: () => peopleService.getPerson(personId),
    enabled: Number.isFinite(personId),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['person', personId] })
    queryClient.invalidateQueries({ queryKey: ['people'] })
  }

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => peopleService.uploadPhoto(personId, file),
    onSuccess: () => {
      toast.success('Photo updated')
      refresh()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not upload the photo.')),
  })

  const onPhotoChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('The photo must be 5 MB or smaller.')
      return
    }
    uploadPhoto.mutate(file)
  }

  if (isLoading) return <LoadingState message="Loading person..." />
  if (isError || !person) {
    return <ErrorState message={apiErrorMessage(error, 'Could not load this person.')} onRetry={() => refetch()} />
  }

  return (
    <PageShell
      title={person.full_name}
      description="Identity record"
      breadcrumbs={[{ label: 'People', path: '/people' }, { label: person.full_name }]}
      actions={
        <div className="flex gap-2">
          <Can tasks={['people.persons.update']}>
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          </Can>
          <Can tasks={['people.persons.delete']}>
            <Button variant="danger" onClick={() => setIsDeleting(true)}>
              Delete
            </Button>
          </Can>
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col items-center gap-3">
              {person.photo ? (
                <img src={person.photo} alt={`Photo of ${person.full_name}`} className="h-32 w-32 rounded-2xl object-cover" />
              ) : (
                <div
                  className="h-32 w-32 rounded-2xl bg-surface flex items-center justify-center text-4xl text-ink-muted"
                  aria-label="No photo"
                >
                  {person.first_name.charAt(0).toUpperCase()}
                </div>
              )}
              <Can tasks={['people.persons.update']}>
                <div className="flex gap-2">
                  <input
                    ref={photoInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    aria-label="Choose photo"
                    onChange={onPhotoChosen}
                  />
                  <Button size="sm" variant="secondary" isLoading={uploadPhoto.isPending} onClick={() => photoInput.current?.click()}>
                    {person.photo ? 'Change photo' : 'Upload photo'}
                  </Button>
                  {person.photo && (
                    <Button size="sm" variant="ghost" onClick={() => setIsRemovingPhoto(true)}>
                      Remove
                    </Button>
                  )}
                </div>
              </Can>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 flex-1">
              <Field label="First name" value={person.first_name} />
              <Field label="Middle name" value={person.middle_name} />
              <Field label="Last name" value={person.last_name} />
              <Field label="Date of birth" value={person.date_of_birth} />
              <Field label="Gender" value={person.gender} />
              <Field label="National ID" value={person.national_id} />
            </dl>
          </div>
        </Card>

        <ContactInfoSection personId={person.id} contacts={person.contact_info} />
        <AddressesSection personId={person.id} addresses={person.addresses} />
        <IdentityDocumentsSection personId={person.id} documents={person.identity_documents} />
      </div>

      {isEditing && (
        <PersonForm
          person={person}
          onClose={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false)
            refresh()
          }}
        />
      )}
      {isDeleting && (
        <ConfirmDialog
          title="Delete person"
          message={`Delete ${person.full_name} and all their contact details, addresses and documents? This cannot be undone.`}
          confirmLabel="Delete person"
          variant="danger"
          onConfirm={async () => {
            await peopleService.deletePerson(person.id)
            toast.success('Person deleted')
            queryClient.invalidateQueries({ queryKey: ['people'] })
            navigate('/people')
          }}
          onClose={() => setIsDeleting(false)}
        />
      )}
      {isRemovingPhoto && (
        <ConfirmDialog
          title="Remove photo"
          message="Remove the profile photo?"
          confirmLabel="Remove photo"
          variant="danger"
          onConfirm={async () => {
            await peopleService.removePhoto(person.id)
            toast.success('Photo removed')
            refresh()
          }}
          onClose={() => setIsRemovingPhoto(false)}
        />
      )}
    </PageShell>
  )
}

const Field: React.FC<{ label: string; value: string | null | undefined }> = ({ label, value }) => (
  <div>
    <dt className="text-sm text-ink-muted">{label}</dt>
    <dd className="text-ink-primary">{value || '—'}</dd>
  </div>
)
