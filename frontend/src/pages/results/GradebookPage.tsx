import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LabeledSelect } from '@/components/shared/LabeledSelect'
import { Input } from '@/components/ui/Input'
import { Can } from '@/components/shared/Can'
import { apiErrorMessage } from '@/lib/apiErrors'
import { useAuthStore } from '@/features/auth/authStore'
import { academicsService } from '@/services/academics'
import { examsService, type ExamComponent } from '@/services/exams'
import { gradebookService, computeTotals, validateMarks, type GradebookStudent } from '@/services/gradebook'

export const GradebookPage: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState('')
  const [section, setSection] = useState('')
  const [exam, setExam] = useState('')
  const [student, setStudent] = useState('')
  const [marks, setMarks] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)

  const periods = useQuery({ queryKey: ['gradebook-periods'], queryFn: () => academicsService.getAcademicPeriods() })
  const sections = useQuery({ queryKey: ['gradebook-sections', period, user?.id], queryFn: () => gradebookService.getSections({ academic_period: Number(period), faculty: user?.id }), enabled: !!period && !!user?.id })
  const exams = useQuery({ queryKey: ['gradebook-exams', period], queryFn: () => examsService.getAll({ academic_period: Number(period) }), enabled: !!period })
  const selectedSection = sections.data?.find((item) => String(item.id) === section)
  const students = useQuery({ queryKey: ['gradebook-students', selectedSection?.group], queryFn: () => gradebookService.searchStudents({ group: selectedSection?.group, page: 1 }), enabled: !!selectedSection?.group })
  const selectedExam = exams.data?.results.find((item) => String(item.id) === exam)
  const components = selectedExam?.components ?? []
  const header = useQuery({ queryKey: ['gradebook-header', exam, student], queryFn: () => gradebookService.findHeader(Number(exam), Number(student)), enabled: !!exam && !!student })

  useEffect(() => {
    if (!header.data) { setMarks({}); return }
    void gradebookService.listEntries({ result_header: header.data.id }).then((result) => setMarks(Object.fromEntries(result.results.map((entry) => [entry.exam_component, String(entry.marks_obtained)]))))
  }, [header.data])

  const currentStudent: GradebookStudent | undefined = students.data?.results.find((item) => String(item.id) === student)
  const total = useMemo(() => computeTotals(Object.values(marks).map((marks_obtained) => ({ marks_obtained })), components.map((component) => ({ max_marks: component.max_marks }))), [marks, components])
  const save = useMutation({
    mutationFn: async () => {
      let resultHeader = header.data
      if (!resultHeader) resultHeader = await gradebookService.startHeader(Number(exam), Number(student))
      for (const component of components) {
        const raw = marks[component.id] ?? ''
        const validation = validateMarks(raw, Number(component.max_marks))
        if (validation) throw new Error(`${component.name}: ${validation}`)
        const existing = (await gradebookService.listEntries({ result_header: resultHeader.id, exam_component: component.id })).results[0]
        if (existing) await gradebookService.updateEntry(existing.id, { marks_obtained: raw })
        else await gradebookService.createEntry({ result_header: resultHeader.id, exam_component: component.id, marks_obtained: raw })
      }
      return gradebookService.syncTotals(resultHeader.id, total)
    },
    onSuccess: () => { toast.success('Draft marks saved'); queryClient.invalidateQueries({ queryKey: ['gradebook-header', exam, student] }) },
    onError: (err) => setError(apiErrorMessage(err, err instanceof Error ? err.message : 'Could not save marks.')),
  })

  if (periods.isLoading) return <LoadingState message="Loading gradebook options..." />
  if (periods.isError) return <ErrorState message={apiErrorMessage(periods.error, 'Could not load academic periods.')} onRetry={() => periods.refetch()} />
  return <PageShell title="Gradebook" description="Enter draft component marks for your assigned sections.">
    <Card><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><LabeledSelect id="gradebook-period" label="Academic period" value={period} placeholder="Choose a period" options={(periods.data ?? []).map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => { setPeriod(value); setSection(''); setExam(''); setStudent('') }} /><LabeledSelect id="gradebook-section" label="Section" value={section} placeholder="Choose a section" options={(sections.data ?? []).map((item) => ({ value: item.id, label: `${item.course_name ?? 'Course'} · ${item.name}` }))} onChange={(value) => { setSection(value); setStudent('') }} disabled={!period} /><LabeledSelect id="gradebook-exam" label="Exam" value={exam} placeholder="Choose an exam" options={(exams.data?.results ?? []).map((item) => ({ value: item.id, label: item.title }))} onChange={(value) => { setExam(value); setStudent('') }} disabled={!period} /></div><div className="mt-4 max-w-md"><LabeledSelect id="gradebook-student" label="Student" value={student} placeholder="Choose a student" options={(students.data?.results ?? []).map((item) => ({ value: item.id, label: `${item.reg_no} · ${item.name}` }))} onChange={setStudent} disabled={!section} /></div></Card>
    {!period || !section || !exam || !student ? <EmptyState icon="🧮" title="Choose a period, section, exam and student" description="Faculty can edit draft marks only for sections assigned to them." /> : !components.length ? <EmptyState icon="🧮" title="No exam components" description="This exam has no components configured yet." /> : <Card className="mt-4"><div className="mb-4 flex items-start justify-between"><div><h2 className="text-h4">{currentStudent?.name ?? 'Student'}</h2><p className="text-sm text-ink-muted">{selectedExam?.title} · Draft only</p></div><span className="text-sm text-ink-secondary">Total: {total.total_obtained} / {total.total_max}</span></div>{error && <Alert variant="error" className="mb-4">{error}</Alert>}<div className="space-y-3">{components.map((component: ExamComponent) => <Input key={component.id} label={`${component.name} (max ${component.max_marks})`} type="number" min="0" max={component.max_marks} step="0.01" value={marks[component.id] ?? ''} onChange={(event) => setMarks((previous) => ({ ...previous, [component.id]: event.target.value }))} />)}</div><div className="mt-5 flex justify-end"><Can tasks={['results.result_components.create', 'results.result_components.update']}><Button onClick={() => { setError(null); save.mutate() }} isLoading={save.isPending}>Save draft marks</Button></Can></div></Card>}
  </PageShell>
}
