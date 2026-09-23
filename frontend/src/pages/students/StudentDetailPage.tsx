import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/shared/PageShell'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Can } from '@/components/shared/Can'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { LabeledSelect } from '@/components/shared/LabeledSelect'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { useCapabilities } from '@/features/auth/useCapabilities'
import { downloadFile } from '@/lib/download'
import { apiErrorMessage } from '@/lib/apiErrors'
import { studentsService } from '@/services/students'
import type { StudentDetail } from '@/services/students'
import { usersApi } from '@/api/users'
import { StudentProfileCorrectionDialog } from './StudentProfileCorrectionDialog'
import { ComplianceCard, FinanceCard, LeavePeriodsCard, PlacementCard, ResultsCard } from './StudentSections'

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  active: 'success',
  graduated: 'info',
  inactive: 'warning',
  suspended: 'danger',
  on_leave: 'warning',
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <dt className="text-sm text-ink-muted">{label}</dt>
    <dd className="text-ink-primary">{children || '—'}</dd>
  </div>
)

const StudentAdminActions: React.FC<{ student: StudentDetail }> = ({ student }) => {
  const client = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const statusMutation = useMutation({ mutationFn: (status: StudentDetail['status']) => studentsService.updateStatus(student.id, status), onSuccess: () => { toast.success('Student status updated'); client.invalidateQueries({ queryKey: ['student', student.id] }) }, onError: (err) => toast.error(apiErrorMessage(err)) })
  const reset = useMutation({ mutationFn: () => usersApi.resetPassword(student.user!, password), onSuccess: () => { toast.success('Temporary password set'); client.invalidateQueries({ queryKey: ['student', student.id] }); setPassword(''); setResetting(false) }, onError: (err) => toast.error(apiErrorMessage(err)) })
  return <>
    <div className="flex flex-wrap items-end gap-3">
      <Can tasks={['students.students.manage_profile']}><Can tasks={['students.onboarding.view']}><Button variant="secondary" onClick={() => setEditing(true)}>Correct profile</Button></Can></Can>
      <Can tasks={['students.students.manage_status']}><div className="w-48"><LabeledSelect id="student-status" label="Student status" value={student.status} options={Object.keys(STATUS_VARIANT).map((value) => ({ value, label: value.replace('_', ' ') }))} onChange={(value) => statusMutation.mutate(value as StudentDetail['status'])} /></div></Can>
      <Can roles={['Admin']}><Button variant="secondary" onClick={() => setResetting(true)}>Reset password</Button></Can>
    </div>
    {editing && <StudentProfileCorrectionDialog studentId={student.id} onClose={() => setEditing(false)} />}
    {resetting && <Modal title="Reset student password" onClose={() => { setResetting(false); setPassword(''); setPasswordConfirmation('') }}><div className="space-y-3"><Input label="Temporary password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} helperText="Share through the approved offline channel. It will not be shown again." /><Input label="Confirm temporary password" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} /><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => { setResetting(false); setPassword(''); setPasswordConfirmation('') }}>Cancel</Button><Button disabled={!password || password !== passwordConfirmation} isLoading={reset.isPending} onClick={() => reset.mutate()}>Set temporary password</Button></div></div></Modal>}
  </>
}

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams()
  const studentId = Number(id)
  const { can } = useCapabilities()
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: student, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => studentsService.getDetail(studentId),
    enabled: Number.isFinite(studentId),
  })

  const downloadTranscript = async () => {
    if (!student) return
    setIsDownloading(true)
    try {
      await downloadFile(`/api/transcripts/${student.id}/`, { filename: `transcript_${student.reg_no}.pdf` })
    } catch (err) {
      toast.error(apiErrorMessage(err, 'The transcript could not be generated.'))
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) return <LoadingState message="Loading student..." />
  if (isError || !student) {
    return <ErrorState message={apiErrorMessage(error, 'Could not load this student.')} onRetry={() => refetch()} />
  }

  return (
    <PageShell
      title={student.name}
      description={`Registration no. ${student.reg_no}`}
      breadcrumbs={[{ label: 'Students', path: '/students' }, { label: student.name }]}
      actions={
        <div className="flex gap-2">
          <Can tasks={['transcripts.transcripts.generate']}>
            <Button variant="secondary" isLoading={isDownloading} onClick={downloadTranscript}>
              Download transcript
            </Button>
          </Can>
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-h4 text-ink-primary">Profile</h2>
            <Badge variant={STATUS_VARIANT[student.status] ?? 'default'}>{student.status_display ?? student.status}</Badge>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-3">
            <Field label="Email">{student.email}</Field>
            <Field label="Phone">{student.phone}</Field>
            <Field label="Date of birth">{student.date_of_birth}</Field>
            <Field label="Enrollment year">{student.enrollment_year}</Field>
            <Field label="Expected graduation">{student.expected_graduation_year}</Field>
            <Field label="Actual graduation">{student.actual_graduation_year}</Field>
            <Field label="Person record">
              {student.person && can('people.persons.view') ? (
                <Link className="text-primary-600 hover:underline" to={`/people/${student.person}`}>
                  {student.person_name || `Person ${student.person}`}
                </Link>
              ) : (
                student.person_name
              )}
            </Field>
          </dl>
        </Card>

        {student.onboarding && (
          <Card>
            <h2 className="text-h4 text-ink-primary mb-4">Onboarding</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Field label="State">{student.onboarding.primary_state.replace(/_/g, ' ')}</Field>
              <Field label="Profile completion">{student.onboarding.profile_completion_percentage}%</Field>
              <Field label="Password changed">{student.onboarding.password_change_required ? 'No' : 'Yes'}</Field>
              <Field label="Documents">{student.onboarding.documents_status}</Field>
            </dl>
            {student.onboarding.missing_fields.length > 0 && (
              <p className="text-sm text-ink-secondary mt-4">Missing fields: {student.onboarding.missing_fields.join(', ')}</p>
            )}
            {student.onboarding.missing_documents.length > 0 && (
              <p className="text-sm text-ink-secondary mt-2">Missing documents: {student.onboarding.missing_documents.map((item) => item.title).join(', ')}</p>
            )}
          </Card>
        )}

        <StudentAdminActions student={student} />

        <PlacementCard student={student} />
        {can('students.leave_periods.view') && <LeavePeriodsCard studentId={student.id} />}
        {can('finance.summary.view') && <FinanceCard studentId={student.id} />}
        {can('results.result_headers.view') && <ResultsCard studentId={student.id} />}
        {can('compliance.requirements.view') && <ComplianceCard studentId={student.id} />}
      </div>
    </PageShell>
  )
}
