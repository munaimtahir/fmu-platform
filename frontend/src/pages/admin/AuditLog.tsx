import { useState, useEffect } from 'react'
import api from '@/api/axios'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SimpleTable } from '@/components/ui/SimpleTable'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'

interface AuditLog {
  id: string
  timestamp: string
  actor: number | null
  actor_username: string
  method: string
  path: string
  status_code: number
  model: string
  object_id: string
  summary: string
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [actorFilter, setActorFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [methodFilter, setMethodFilter] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (actorFilter) params.append('actor', actorFilter)
      if (entityFilter) params.append('entity', entityFilter)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (methodFilter) params.append('method', methodFilter)

      const response = await api.get(`/api/audit/?${params.toString()}`)
      setLogs(response.data.results || response.data)
    } catch (err) {
      setError('Failed to load audit logs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleSearch = () => {
    fetchLogs()
  }

  const handleReset = () => {
    setActorFilter('')
    setEntityFilter('')
    setDateFrom('')
    setDateTo('')
    setMethodFilter('')
  }

  const handleExportCSV = () => {
    if (logs.length === 0) {
      setError('No data to export')
      return
    }

    // Create CSV content
    const headers = [
      'Timestamp',
      'Actor',
      'Method',
      'Path',
      'Status',
      'Model',
      'Object ID',
      'Summary',
    ]

    const rows = logs.map((log) => [
      log.timestamp,
      log.actor_username || 'N/A',
      log.method,
      log.path,
      log.status_code,
      log.model,
      log.object_id,
      log.summary.replace(/,/g, ';'), // Escape commas
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (log: AuditLog) =>
        new Date(log.timestamp).toLocaleString(),
    },
    { key: 'actor_username', label: 'Actor' },
    {
      key: 'method',
      label: 'Method',
      render: (log: AuditLog) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            log.method === 'POST'
              ? 'bg-green-100 text-green-800'
              : log.method === 'PUT' || log.method === 'PATCH'
                ? 'bg-blue-100 text-blue-800'
                : log.method === 'DELETE'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
          }`}
        >
          {log.method}
        </span>
      ),
    },
    {
      key: 'path',
      label: 'Path',
      render: (log: AuditLog) => (
        <span className="text-xs font-mono">{log.path}</span>
      ),
    },
    {
      key: 'status_code',
      label: 'Status',
      render: (log: AuditLog) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            log.status_code >= 200 && log.status_code < 300
              ? 'bg-green-100 text-green-800'
              : log.status_code >= 400
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {log.status_code}
        </span>
      ),
    },
    { key: 'model', label: 'Model' },
    { key: 'summary', label: 'Summary' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Audit Log</h1>
        {logs.length > 0 && (
          <Button onClick={handleExportCSV}>Export CSV</Button>
        )}
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <div className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Actor</label>
              <Input
                type="text"
                placeholder="Username"
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Entity</label>
              <Input
                type="text"
                placeholder="Model name"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Method</label>
              <select
                className="w-full p-2 border rounded-md"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Date From
              </label>
              <Input
                type="datetime-local"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date To</label>
              <Input
                type="datetime-local"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && logs.length > 0 && (
        <Card>
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">
              Audit Log Entries ({logs.length})
            </h2>
            <SimpleTable data={logs} columns={columns} keyField="id" />
          </div>
        </Card>
      )}

      {!loading && logs.length === 0 && (
        <Card>
          <div className="p-4 text-center text-gray-600">
            No audit logs found matching the filters
          </div>
        </Card>
      )}
    </div>
  )
}
