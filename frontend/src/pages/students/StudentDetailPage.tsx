import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/shared/PageShell'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Can } from '@/components/shared/Can'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { useCapabilities } from '@/features/auth/useCapabilities'
import { StudentForm } from '@/features/students/StudentForm'
import { downloadFile } from '@/lib/download'
import { apiErrorMessage } from '@/lib/apiErrors'
import { studentsService } from '@/services/students'
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

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams()
  const studentId = Number(id)
  const queryClient = useQueryClient()
  const { can } = useCapabilities()
  const [isEditing, setIsEditing] = useState(false)
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
          <Can tasks={['students.students.update']}>
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          </Can>
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

        <PlacementCard student={student} />
        {can('students.leave_periods.view') && <LeavePeriodsCard studentId={student.id} />}
        {can('finance.summary.view') && <FinanceCard studentId={student.id} />}
        {can('results.result_headers.view') && <ResultsCard studentId={student.id} />}
        {can('compliance.requirements.view') && <ComplianceCard studentId={student.id} />}
      </div>

      {isEditing && (
        <StudentForm
          student={student}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false)
            queryClient.invalidateQueries({ queryKey: ['student', studentId] })
            queryClient.invalidateQueries({ queryKey: ['students'] })
          }}
        />
      )}
    </PageShell>
  )
}
