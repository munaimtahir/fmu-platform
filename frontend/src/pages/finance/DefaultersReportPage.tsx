import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { financeService } from '@/services'
import type { DefaulterRow } from '@/types'
import { Button } from '@/components/ui/Button'

export const DefaultersReportPage: React.FC = () => {
  const [rows, setRows] = useState<DefaulterRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [programs, setPrograms] = useState<{ id: number; name: string }[]>([])
  const [terms, setTerms] = useState<{ id: number; name: string }[]>([])
  const [filters, setFilters] = useState({
    program_id: '',
    term_id: '',
    min_outstanding: '0',
  })

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [programsData, termsData] = await Promise.all([
          financeService.getPrograms(),
          financeService.getAcademicPeriods(),
        ])
        setPrograms(programsData)
        setTerms(termsData)
      } catch (err) {
        console.error('Error loading options:', err)
      }
    }
    loadOptions()
  }, [])

  const handleGenerate = async () => {
    if (!filters.term_id) {
      setError('Please select a term')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await financeService.getDefaultersReport({
        program_id: filters.program_id ? parseInt(filters.program_id) : undefined,
        term_id: parseInt(filters.term_id),
        min_outstanding: parseFloat(filters.min_outstanding) || 0,
      })
      setRows(data)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate report')
      console.error('Error generating report:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    if (!filters.term_id) {
      alert('Please select a term and generate report first')
      return
    }

    try {
      const blob = await financeService.exportDefaultersCSV({
        program_id: filters.program_id ? parseInt(filters.program_id) : undefined,
        term_id: parseInt(filters.term_id),
        min_outstanding: parseFloat(filters.min_outstanding) || 0,
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `defaulters_${filters.term_id}_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to export CSV')
      console.error('Error exporting CSV:', err)
    }
  }

  const columns: ColumnDef<DefaulterRow>[] = [
    {
      accessorKey: 'reg_no',
      header: 'Reg No',
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'outstanding',
      header: 'Outstanding',
      cell: ({ row }) => `${parseFloat(row.getValue('outstanding')).toFixed(2)} PKR`,
    },
    {
      accessorKey: 'overdue_days',
      header: 'Overdue Days',
    },
    {
      accessorKey: 'latest_voucher_no',
      header: 'Latest Voucher',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Defaulters Report</h1>
          <p className="text-gray-600">List of students with outstanding dues above threshold.</p>
        </div>

        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program (Optional)
                </label>
                <select
                  value={filters.program_id}
                  onChange={(e) => setFilters({ ...filters, program_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Programs</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term <span className="text-red-500">*</span>
                </label>
                <select
                  value={filters.term_id}
                  onChange={(e) => setFilters({ ...filters, term_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Term</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Outstanding
                </label>
                <input
                  type="number"
                  value={filters.min_outstanding}
                  onChange={(e) => setFilters({ ...filters, min_outstanding: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={loading || !filters.term_id}>
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
              {rows.length > 0 && (
                <Button onClick={handleExportCSV} variant="secondary">
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {rows.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Results ({rows.length} defaulters)</h2>
            <DataTable
              data={rows}
              columns={columns}
              enableSorting
              enableFiltering
              enablePagination
              isLoading={loading}
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
