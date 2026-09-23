import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PageShell } from '@/components/shared/PageShell'
import { Spinner } from '@/components/ui/Spinner'
import { onboardingService, type OnboardingProfile } from '@/services/onboarding'
import { useDownload } from '@/lib/download'
import { apiErrorMessage } from '@/lib/apiErrors'
import { Link } from 'react-router-dom'

const emptyAddress = { street: '', city: '', state: '', postal_code: '', country: 'Pakistan' }

export function StudentOnboardingPage() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['student-onboarding'], queryFn: onboardingService.get })
  const [form, setForm] = useState<OnboardingProfile | null>(null)
  const [documentFiles, setDocumentFiles] = useState<Record<number, File | null>>({})
  const { download, error: downloadError, isDownloading } = useDownload()

  useEffect(() => {
    if (query.data) setForm((current) => current ?? query.data.profile)
  }, [query.data])

  const save = useMutation({
    mutationFn: (profile: Partial<OnboardingProfile>) => onboardingService.updateProfile(profile),
    onSuccess: (payload, submitted) => {
      queryClient.setQueryData(['student-onboarding'], payload)
      setForm((current) => {
        if (!current) return payload.profile
        const merged = { ...current }
        for (const key of Object.keys(submitted) as Array<keyof OnboardingProfile>) {
          if (JSON.stringify(current[key]) === JSON.stringify(submitted[key])) {
            Object.assign(merged, { [key]: payload.profile[key] })
          }
        }
        return merged
      })
      toast.success('Profile progress saved')
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Could not save profile progress')),
  })

  const submitDocument = useMutation({
    mutationFn: ({ requirementId, file }: { requirementId: number; file: File }) =>
      onboardingService.submitDocument(requirementId, file),
    onSuccess: (payload) => {
      queryClient.setQueryData(['student-onboarding'], payload)
      toast.success('Document submitted')
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Could not submit document')),
  })

  if (query.isError) {
    return <Alert variant="error">Unable to load your onboarding profile. <Button onClick={() => query.refetch()}>Retry</Button></Alert>
  }
  if (query.isLoading || !form) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }
  if (query.isError || !query.data) {
    return <Alert variant="error">Unable to load your onboarding profile.</Alert>
  }

  const status = query.data.onboarding
  const address = form.residential_address ?? emptyAddress
  const setField = <K extends keyof OnboardingProfile>(key: K, value: OnboardingProfile[K]) =>
    setForm((current) => current ? { ...current, [key]: value } : current)
  const saveFields = (keys: Array<keyof OnboardingProfile>) => save.mutate(Object.fromEntries(keys.map((key) => [key, form[key]])) as Partial<OnboardingProfile>)

  return (
    <PageShell title="Complete your profile" description="Save any section now and return whenever you need to.">
      <div className="space-y-6">
        <Link to="/dashboard/student" className="text-primary-600 hover:underline">Continue to dashboard and finish later</Link>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-ink-secondary">Profile completion</p>
              <p className="text-h2 text-ink-primary">{status.profile_completion_percentage}%</p>
            </div>
            <div className="text-sm text-ink-secondary">
              {status.missing_sections.length ? `Remaining: ${status.missing_sections.join(', ')}` : 'Required profile fields complete'}
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-h2 mb-4">Personal identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="First name" value={form.first_name} disabled />
            <Input label="Middle name" value={form.middle_name} disabled />
            <Input label="Last name" value={form.last_name} disabled />
            <Input label="Date of birth" type="date" value={form.date_of_birth ?? ''} onChange={(e) => setField('date_of_birth', e.target.value || null)} />
            <Select
              label="Gender"
              value={form.gender}
              placeholder="Select gender"
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
                { value: 'prefer_not_to_say', label: 'Prefer not to say' },
              ]}
              onChange={(value) => setField('gender', value)}
            />
          </div>
          <div className="mt-4 flex justify-end"><Button variant="secondary" isLoading={save.isPending} onClick={() => saveFields(['date_of_birth', 'gender'])}>Save personal identity</Button></div>
        </Card>

        <Card>
          <h2 className="text-h2 mb-4">Contact information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
            <Input label="Mobile number" value={form.mobile_number} onChange={(e) => setField('mobile_number', e.target.value)} />
          </div>
          <div className="mt-4 flex justify-end"><Button variant="secondary" isLoading={save.isPending} onClick={() => saveFields(['email', 'mobile_number'])}>Save contact information</Button></div>
        </Card>

        <Card>
          <h2 className="text-h2 mb-4">Residential address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['street', 'city', 'state', 'postal_code', 'country'] as const).map((field) => (
              <Input
                key={field}
                label={field.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
                value={address[field]}
                onChange={(e) => setField('residential_address', { ...address, [field]: e.target.value })}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-end"><Button variant="secondary" isLoading={save.isPending} onClick={() => saveFields(['residential_address'])}>Save address</Button></div>
        </Card>

        <Card>
          <h2 className="text-h2 mb-4">Emergency contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Name" value={form.emergency_contact_name} onChange={(e) => setField('emergency_contact_name', e.target.value)} />
            <Input label="Phone" value={form.emergency_contact_phone} onChange={(e) => setField('emergency_contact_phone', e.target.value)} />
            <Input label="Relationship" value={form.emergency_contact_relationship} onChange={(e) => setField('emergency_contact_relationship', e.target.value)} />
          </div>
          <div className="mt-4 flex justify-end"><Button variant="secondary" isLoading={save.isPending} onClick={() => saveFields(['emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'])}>Save emergency contact</Button></div>
        </Card>

        <Card>
          <h2 className="text-h2 mb-4">Required documents</h2>
          {downloadError && <Alert variant="error">{downloadError}</Alert>}
          {status.documents.length === 0 ? (
            <Alert variant="success">No onboarding documents are required.</Alert>
          ) : (
            <div className="space-y-4">
              {status.documents.map((document) => (
                <div key={document.requirement_id} className="border-b border-surface-border pb-4">
                  <div className="flex items-center justify-between gap-3"><div><p className="font-medium">{document.title}</p>{document.description && <p className="text-sm text-ink-muted">{document.description}</p>}</div><span className="text-sm capitalize">{document.status}</span></div>
                  {document.notes && <Alert variant={document.status === 'rejected' ? 'error' : 'info'}>{document.notes}</Alert>}
                  {document.submissions.length > 0 && <ul className="my-3 space-y-1">{document.submissions.map((submission) => <li key={submission.id} className="flex items-center gap-2 text-sm"><span>{new Date(submission.created_at).toLocaleString()}</span>{submission.has_file && <Button size="sm" variant="ghost" disabled={isDownloading} onClick={() => download(onboardingService.documentDownloadPath(document.requirement_id, submission.id), { filename: submission.file_name })}>Download</Button>}</li>)}</ul>}
                  {document.status !== 'verified' && <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <div className="flex-1">
                    <Input
                      label={document.title}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={(event) => setDocumentFiles((files) => ({ ...files, [document.requirement_id]: event.target.files?.[0] ?? null }))}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    disabled={!documentFiles[document.requirement_id] || submitDocument.isPending}
                    onClick={() => {
                      const file = documentFiles[document.requirement_id]
                      if (file) submitDocument.mutate({ requirementId: document.requirement_id, file })
                    }}
                  >
                    {document.submissions.length ? 'Replace document' : 'Submit document'}
                  </Button>
                  </div>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  )
}
