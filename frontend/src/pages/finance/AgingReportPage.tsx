import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { financeService } from '@/services'
import type { AgingReport } from '@/types'
import { Button } from '@/components/ui/Button'

export const AgingReportPage: React.FC = () => {
  const [report, setReport] = useState<AgingReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [terms, setTerms] = useState<{ id: number; name: string }[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>('')

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
    setLoading(true)
    setError(null)
    try {
      const data = await financeService.getAgingReport(
        selectedTerm ? parseInt(selectedTerm) : undefined
      )
      setReport(data)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate report')
      console.error('Error generating report:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const blob = await financeService.exportAgingCSV(
        selectedTerm ? parseInt(selectedTerm) : undefined
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `aging_report_${selectedTerm || 'all'}_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to export CSV')
      console.error('Error exporting CSV:', err)
    }
  }

  const bucketLabels: Record<string, string> = {
    '0_7': '0-7 days',
    '8_30': '8-30 days',
    '31_60': '31-60 days',
    '60_plus': '60+ days',
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aging Report</h1>
          <p className="text-gray-600">Outstanding dues grouped by aging buckets.</p>
        </div>

        <Card>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term (Optional)
                </label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Terms</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
              {report && (
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

        {report && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">
              Aging Report - {report.term_name}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bucket
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(report.buckets).map(([key, data]) => (
                    <tr key={key}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bucketLabels[key]}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {bucketLabels[key]}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {data.count}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {data.amount.toFixed(2)} PKR
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
