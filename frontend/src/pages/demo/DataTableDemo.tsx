import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Student {
  id: string
  name: string
  email: string
  program: string
  gpa: number
  status: 'active' | 'inactive' | 'graduated'
}

const mockStudents: Student[] = [
  { id: 'S2024001', name: 'John Doe', email: 'john.doe@example.com', program: 'Computer Science', gpa: 3.8, status: 'active' },
  { id: 'S2024002', name: 'Jane Smith', email: 'jane.smith@example.com', program: 'Engineering', gpa: 3.9, status: 'active' },
  { id: 'S2024003', name: 'Bob Johnson', email: 'bob.johnson@example.com', program: 'Mathematics', gpa: 3.5, status: 'active' },
  { id: 'S2024004', name: 'Alice Williams', email: 'alice.w@example.com', program: 'Physics', gpa: 3.7, status: 'active' },
  { id: 'S2024005', name: 'Charlie Brown', email: 'charlie.b@example.com', program: 'Chemistry', gpa: 3.6, status: 'inactive' },
  { id: 'S2023001', name: 'Diana Prince', email: 'diana.p@example.com', program: 'Computer Science', gpa: 3.95, status: 'graduated' },
  { id: 'S2023002', name: 'Bruce Wayne', email: 'bruce.w@example.com', program: 'Engineering', gpa: 3.85, status: 'graduated' },
  { id: 'S2024006', name: 'Clark Kent', email: 'clark.k@example.com', program: 'Physics', gpa: 3.9, status: 'active' },
  { id: 'S2024007', name: 'Peter Parker', email: 'peter.p@example.com', program: 'Chemistry', gpa: 3.7, status: 'active' },
  { id: 'S2024008', name: 'Tony Stark', email: 'tony.s@example.com', program: 'Engineering', gpa: 4.0, status: 'active' },
  { id: 'S2024009', name: 'Natasha Romanoff', email: 'nat.r@example.com', program: 'Mathematics', gpa: 3.8, status: 'active' },
  { id: 'S2024010', name: 'Steve Rogers', email: 'steve.r@example.com', program: 'Computer Science', gpa: 3.75, status: 'active' },
]

export const DataTableDemo = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'id',
      header: 'Student ID',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue('id')}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('name')}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-gray-600">{row.getValue('email')}</span>
      ),
    },
    {
      accessorKey: 'program',
      header: 'Program',
    },
    {
      accessorKey: 'gpa',
      header: 'GPA',
      cell: ({ row }) => {
        const gpa = row.getValue('gpa') as number
        return (
          <span className={`font-semibold ${gpa >= 3.8 ? 'text-emerald-600' : gpa >= 3.5 ? 'text-blue-600' : 'text-gray-600'}`}>
            {gpa.toFixed(2)}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const variants = {
          active: 'success',
          inactive: 'warning',
          graduated: 'primary',
        } as const
        return (
          <Badge variant={variants[status as keyof typeof variants]}>
            {status}
          </Badge>
        )
      },
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            DataTable Component Demo
          </h1>
          <p className="text-gray-600">
            Interactive demonstration of the DataTable component with sorting, filtering, and pagination.
          </p>
        </div>

        {/* Features Overview */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🔍', label: 'Global Search', desc: 'Search across all columns' },
              { icon: '↕️', label: 'Column Sorting', desc: 'Click headers to sort' },
              { icon: '📄', label: 'Pagination', desc: 'Navigate through pages' },
              { icon: '📊', label: 'CSV Export', desc: 'Export data to CSV' },
              { icon: '✅', label: 'Row Selection', desc: 'Select specific rows' },
              { icon: '👁️', label: 'Column Visibility', desc: 'Show/hide columns' },
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{feature.label}</p>
                  <p className="text-xs text-gray-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* DataTable */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Student Records
          </h2>
          <DataTable
            data={mockStudents}
            columns={columns}
            enableSorting
            enableFiltering
            enablePagination
            enableRowSelection
            pageSize={10}
            onRowClick={(student) => setSelectedStudent(student)}
          />
        </div>

        {/* Selected Row Info */}
        {selectedStudent && (
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Selected Student
                </h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">ID:</span> <span className="font-mono">{selectedStudent.id}</span></p>
                  <p><span className="text-gray-600">Name:</span> {selectedStudent.name}</p>
                  <p><span className="text-gray-600">Email:</span> {selectedStudent.email}</p>
                  <p><span className="text-gray-600">Program:</span> {selectedStudent.program}</p>
                  <p><span className="text-gray-600">GPA:</span> {selectedStudent.gpa}</p>
                  <p><span className="text-gray-600">Status:</span> {selectedStudent.status}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </Card>
        )}

        {/* Usage Example */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Usage Example
          </h2>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { DataTable } from '@/components/ui/DataTable/DataTable'
import { ColumnDef } from '@tanstack/react-table'

const columns: ColumnDef<Student>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  // ... more columns
]

<DataTable
  data={students}
  columns={columns}
  enableSorting
  enableFiltering
  enablePagination
  pageSize={10}
/>`}
          </pre>
        </Card>
      </div>
    </DashboardLayout>
  )
}
