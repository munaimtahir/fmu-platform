import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { financeService } from '@/services'
import type { StatementEntry, StudentStatement } from '@/types'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'

export const StudentStatementPage: React.FC = () => {
  const { user } = useAuth()
  const [statement, setStatement] = useState<StudentStatement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [terms, setTerms] = useState<{ id: number; name: string }[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [studentId, setStudentId] = useState<number | null>(
    user?.student_id ? parseInt(user.student_id.toString()) : null
  )

  useEffect(() => {
    const loadTerms = async () => {
      try {
        const data = await financeService.getAcademicPeriods()
        setTerms(data)
      } catch (err) {
        console.error('Error loading terms:', err)
      }
    }
    loadTerms()
  }, [])

  const handleGenerate = async () => {
    if (!studentId) {
      setError('Please select a student')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await financeService.getStudentStatement(
        studentId,
        selectedTerm ? parseInt(selectedTerm) : undefined
      )
      setStatement(data)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate statement')
      console.error('Error generating statement:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!studentId) {
      alert('Please select a student first')
      return
    }

    try {
      const blob = await financeService.downloadStatementPDF(
        studentId,
        selectedTerm ? parseInt(selectedTerm) : undefined
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const termName = statement?.term_name || 'all'
      a.download = `statement_${statement?.student_reg_no || studentId}_${termName}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download PDF')
      console.error('Error downloading PDF:', err)
    }
  }

  const columns: ColumnDef<StatementEntry>[] = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => new Date(row.getValue('date')).toLocaleDateString(),
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'debit',
      header: 'Debit',
      cell: ({ row }) => {
        const debit = row.getValue('debit') as number | undefined
        return debit ? `${debit.toFixed(2)} PKR` : '-'
      },
    },
    {
      accessorKey: 'credit',
      header: 'Credit',
      cell: ({ row }) => {
        const credit = row.getValue('credit') as number | undefined
        return credit ? `${credit.toFixed(2)} PKR` : '-'
      },
    },
    {
      accessorKey: 'running_balance',
      header: 'Balance',
      cell: ({ row }) => `${parseFloat(row.getValue('running_balance')).toFixed(2)} PKR`,
    },
  ]

  // If user is a student, auto-load their statement
  useEffect(() => {
    if (user?.student_id && !studentId) {
      const id = parseInt(user.student_id.toString())
      setStudentId(id)
      // Auto-load for students
      if (id) {
        setLoading(true)
        financeService
          .getStudentStatement(id, selectedTerm ? parseInt(selectedTerm) : undefined)
          .then(setStatement)
          .catch((err: any) => {
            setError(err.response?.data?.error?.message || 'Failed to load statement')
            console.error('Error loading statement:', err)
          })
          .finally(() => setLoading(false))
      }
    }
  }, [user, selectedTerm])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Ledger Statement</h1>
          <p className="text-gray-600">Chronological ledger entries with running balances.</p>
        </div>

        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!user?.student_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={studentId || ''}
                    onChange={(e) => setStudentId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term (Optional)
                </label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Time</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={loading || !studentId}>
                {loading ? 'Generating...' : 'Generate Statement'}
              </Button>
              {statement && (
                <Button onClick={handleDownloadPDF} variant="secondary">
                  Download PDF
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

        {statement && (
          <div className="space-y-4">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Student Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-lg font-semibold">{statement.student_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registration No</p>
                  <p className="text-lg font-semibold">{statement.student_reg_no}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Term</p>
                  <p className="text-lg font-semibold">{statement.term_name}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Opening Balance</p>
                  <p className="text-xl font-semibold">{statement.opening_balance.toFixed(2)} PKR</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Closing Balance</p>
                  <p className="text-xl font-semibold">{statement.closing_balance.toFixed(2)} PKR</p>
                </div>
              </div>
              <h2 className="text-lg font-semibold mb-4">Ledger Entries</h2>
              <DataTable
                data={statement.entries}
                columns={columns}
                enableSorting
                enableFiltering
                enablePagination
                isLoading={loading}
              />
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
