import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { studentsService } from '@/services/students'
import type { OnboardingProfile } from '@/services/onboarding'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Select } from '@/components/ui/Select'
import { LoadingState } from '@/components/shared/LoadingState'
import { apiErrorMessage } from '@/lib/apiErrors'

export function StudentProfileCorrectionDialog({ studentId, onClose }: { studentId: number; onClose: () => void }) {
  const client = useQueryClient()
  const [changes, setChanges] = useState<Partial<OnboardingProfile>>({})
  const query = useQuery({ queryKey: ['student-onboarding-admin', studentId], queryFn: () => studentsService.getOnboarding(studentId) })
  const save = useMutation({
    mutationFn: () => studentsService.updateProfile(studentId, changes),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['student', studentId] })
      client.invalidateQueries({ queryKey: ['students'] })
      client.invalidateQueries({ queryKey: ['student-onboarding-admin', studentId] })
      toast.success('Student profile corrected')
      onClose()
    },
  })
  const profile = query.data ? { ...query.data.profile, ...changes } : null
  const address = profile?.residential_address ?? { street: '', city: '', state: '', postal_code: '', country: 'Pakistan' }
  const textFields = ['first_name', 'middle_name', 'last_name', 'email', 'mobile_number', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'] as const
  const label = (name: string) => name.replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase())
  return <Modal title="Correct student profile" onClose={onClose} size="lg">
    {query.isLoading && <LoadingState message="Loading profile..." />}
    {query.isError && <Alert variant="error">{apiErrorMessage(query.error)} <Button onClick={() => query.refetch()}>Retry</Button></Alert>}
    {profile && <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); save.mutate() }}>
      {save.isError && <Alert variant="error">{apiErrorMessage(save.error)}</Alert>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {textFields.map((field) => <Input key={field} label={label(field)} value={profile[field]} onChange={(event) => setChanges((current) => ({ ...current, [field]: event.target.value }))} />)}
        <Input label="Date of birth" type="date" value={profile.date_of_birth ?? ''} onChange={(event) => setChanges((current) => ({ ...current, date_of_birth: event.target.value || null }))} />
        <Select label="Gender" value={profile.gender} options={['male', 'female', 'other', 'prefer_not_to_say'].map((value) => ({ value, label: label(value) }))} onChange={(gender) => setChanges((current) => ({ ...current, gender }))} />
        {(['street', 'city', 'state', 'postal_code', 'country'] as const).map((field) => <Input key={field} label={label(field)} value={address[field]} onChange={(event) => setChanges((current) => ({ ...current, residential_address: { ...address, [field]: event.target.value } }))} />)}
      </div>
      <div className="flex justify-end gap-2"><Button variant="secondary" type="button" onClick={onClose}>Cancel</Button><Button type="submit" isLoading={save.isPending}>Save correction</Button></div>
    </form>}
  </Modal>
}
