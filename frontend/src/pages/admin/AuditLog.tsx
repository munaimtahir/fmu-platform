import { useEffect, useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import api from '@/api/axios'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'

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

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        id: 'timestamp',
        header: 'Timestamp',
        accessorFn: (log) => log.timestamp,
        cell: ({ row }) => new Date(row.original.timestamp).toLocaleString(),
      },
      { accessorKey: 'actor_username', header: 'Actor' },
      {
        id: 'method',
        header: 'Method',
        accessorFn: (log) => log.method,
        cell: ({ row }) => {
          const log = row.original
          const methodVariant: BadgeVariant =
            log.method === 'POST'
              ? 'success'
              : log.method === 'PUT' || log.method === 'PATCH'
                ? 'info'
                : log.method === 'DELETE'
                  ? 'danger'
                  : 'default'
          return <Badge variant={methodVariant}>{log.method}</Badge>
        },
      },
      {
        id: 'path',
        header: 'Path',
        accessorFn: (log) => log.path,
        cell: ({ row }) => (
          <span className="text-xs font-mono">{row.original.path}</span>
        ),
      },
      {
        id: 'status_code',
        header: 'Status',
        accessorFn: (log) => log.status_code,
        cell: ({ row }) => {
          const log = row.original
          const outcome =
            log.status_code >= 200 && log.status_code < 300
              ? 'SUCCESS'
              : log.status_code >= 400
                ? 'FAILURE'
                : 'WARNING'
          return <StatusBadge domain="audit" status={outcome} label={String(log.status_code)} />
        },
      },
      { accessorKey: 'model', header: 'Model' },
      { accessorKey: 'summary', header: 'Summary' },
    ],
    []
  )

  return (
    <PageShell
      title="Audit Log"
      description="System-wide record of create/update/delete actions and their outcomes."
      actions={logs.length > 0 ? <Button onClick={handleExportCSV}>Export CSV</Button> : undefined}
    >
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <div className="p-4 space-y-4">
          <h2 className="text-h4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Actor"
              type="text"
              placeholder="Username"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
            />
            <Input
              label="Entity"
              type="text"
              placeholder="Model name"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            />
            <Select
              label="Method"
              value={methodFilter}
              onChange={setMethodFilter}
              options={[
                { value: '', label: 'All' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'PATCH', label: 'PATCH' },
                { value: 'DELETE', label: 'DELETE' },
              ]}
            />
            <Input
              label="Date From"
              type="datetime-local"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              label="Date To"
              type="datetime-local"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
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

      <Card>
        <div className="p-4">
          <h2 className="text-h3 mb-4">
            Audit Log Entries ({logs.length})
          </h2>
          <DataTable data={logs} columns={columns} isLoading={loading} />
        </div>
      </Card>
    </PageShell>
  )
}
