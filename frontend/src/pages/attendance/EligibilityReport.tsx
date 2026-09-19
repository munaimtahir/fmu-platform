import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { PageShell } from '@/components/shared/PageShell'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { apiErrorMessage } from '@/lib/apiErrors'
import { saveBlob } from '@/lib/download'
import {
  buildEligibilityReport,
  eligibilityToCsv,
  listSections,
  sectionLabel,
  type EligibilityRow,
  type EligibilitySection,
} from '@/services/attendanceEligibility'

const DEFAULT_THRESHOLD = 75

export function EligibilityReport() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [selected, setSelected] = useState<Record<number, EligibilitySection>>({})
  const [threshold, setThreshold] = useState(String(DEFAULT_THRESHOLD))
  const [formError, setFormError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const sectionsQuery = useQuery({
    queryKey: ['eligibility-sections', debouncedSearch],
    queryFn: () => listSections(debouncedSearch),
  })

  const reportMutation = useMutation({
    mutationFn: (input: { sections: EligibilitySection[]; threshold: number }) =>
      buildEligibilityReport(input.sections, input.threshold, (done, total) => setProgress({ done, total })),
    onSettled: () => setProgress(null),
  })

  const rows: EligibilityRow[] = reportMutation.data ?? []
  const eligibleCount = rows.filter((row) => row.eligible).length

  const toggle = (section: EligibilitySection) =>
    setSelected((prev) => {
      const next = { ...prev }
      if (next[section.id]) delete next[section.id]
      else next[section.id] = section
      return next
    })

  const generate = () => {
    const value = Number(threshold)
    if (threshold.trim() === '' || Number.isNaN(value) || value < 0 || value > 100) {
      setFormError('Threshold must be a number between 0 and 100.')
      return
    }
    const sections = Object.values(selected)
    if (sections.length === 0) {
      setFormError('Select at least one section.')
      return
    }
    setFormError(null)
    reportMutation.mutate({ sections, threshold: value })
  }

  const exportCsv = () => {
    saveBlob(new Blob([eligibilityToCsv(rows)], { type: 'text/csv' }), `eligibility_report_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const columns = useMemo<ColumnDef<EligibilityRow>[]>(
    () => [
      { accessorKey: 'reg_no', header: 'Reg No' },
      { accessorKey: 'student_name', header: 'Student Name' },
      { accessorKey: 'section_id', header: 'Section' },
      {
        id: 'percentage',
        header: 'Attendance %',
        accessorFn: (row) => row.attendance_percentage,
        cell: ({ row }) => `${row.original.attendance_percentage.toFixed(1)}%`,
      },
      {
        id: 'eligible',
        header: 'Eligible',
        accessorFn: (row) => row.eligible,
        cell: ({ row }) => (
          <StatusBadge
            domain="attendance"
            status={row.original.eligible ? 'ELIGIBLE' : 'INELIGIBLE'}
            label={row.original.eligible ? 'Eligible' : 'Not Eligible'}
          />
        ),
      },
    ],
    []
  )

  const sections = sectionsQuery.data ?? []
  const selectedCount = Object.keys(selected).length

  return (
    <PageShell
      title="Eligibility Report"
      description="Attendance eligibility for every student in the chosen sections."
      actions={rows.length > 0 ? <Button onClick={exportCsv}>Export CSV</Button> : undefined}
    >
      {formError && <Alert variant="error">{formError}</Alert>}
      {reportMutation.isError && <Alert variant="error">{apiErrorMessage(reportMutation.error, 'Failed to generate the report')}</Alert>}

      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="eligibility-threshold"
              label="Minimum attendance (%)"
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
            <Input
              id="eligibility-section-search"
              label="Find sections"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Course or section name"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-ink-secondary mb-2">Sections ({selectedCount} selected)</p>
            {sectionsQuery.isLoading && <LoadingState message="Loading sections..." />}
            {sectionsQuery.isError && (
              <ErrorState title="Could not load sections" message={apiErrorMessage(sectionsQuery.error)} onRetry={() => sectionsQuery.refetch()} />
            )}
            {sectionsQuery.data && sections.length === 0 && <EmptyState icon="📚" title="No sections found" description="Try a different search." />}
            {sections.length > 0 && (
              <div className="max-h-56 overflow-y-auto border border-surface-border rounded-2xl divide-y divide-surface-border">
                {sections.map((section) => (
                  <label key={section.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface">
                    <input type="checkbox" checked={!!selected[section.id]} onChange={() => toggle(section)} />
                    <span className="text-ink-primary">{sectionLabel(section)}</span>
                    {section.group_name && <span className="text-sm text-ink-muted">Group {section.group_name}</span>}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={generate} isLoading={reportMutation.isPending}>
              Generate report
            </Button>
            {progress && (
              <span className="text-sm text-ink-secondary" role="status">
                Checked {progress.done} of {progress.total} students
              </span>
            )}
          </div>
        </div>
      </Card>

      {reportMutation.isSuccess && rows.length === 0 && (
        <Card>
          <EmptyState
            icon="🧑‍🎓"
            title="No students to report on"
            description="The selected sections have no group or no enrolled students."
          />
        </Card>
      )}

      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-4">
                <div className="text-sm text-ink-secondary">Students</div>
                <div className="text-h2 text-ink-primary">{rows.length}</div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-sm text-success">Eligible</div>
                <div className="text-h2 text-success">{eligibleCount}</div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-sm text-danger">Not eligible</div>
                <div className="text-h2 text-danger">{rows.length - eligibleCount}</div>
              </div>
            </Card>
          </div>
          <Card>
            <DataTable data={rows} columns={columns} />
          </Card>
        </>
      )}
    </PageShell>
  )
}
