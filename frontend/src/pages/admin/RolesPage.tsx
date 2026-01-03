import React from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

/**
 * RolesPage - Role and permissions viewer
 * Displays the role-based access control (RBAC) matrix
 */
export const RolesPage: React.FC = () => {
  const roles = [
    {
      name: 'Admin',
      description: 'Full system access with all permissions',
      permissions: {
        'Admissions': 'CRUD',
        'Enrollment': 'CRUD',
        'Attendance': 'CRUD',
        'Assessments': 'CRUD',
        'Results': 'CRUD',
        'Transcripts': 'Issue/Verify',
        'Requests': 'CRUD',
      },
    },
    {
      name: 'Registrar',
      description: 'Manages enrollment, approves results, and issues transcripts',
      permissions: {
        'Admissions': 'Read',
        'Enrollment': 'CRUD',
        'Attendance': 'Read',
        'Assessments': 'Read',
        'Results': 'Approve/Publish',
        'Transcripts': 'Issue',
        'Requests': 'Approve',
      },
    },
    {
      name: 'Faculty',
      description: 'Manages attendance and assessments for assigned sections',
      permissions: {
        'Admissions': 'Read',
        'Enrollment': 'Read',
        'Attendance': 'CRUD (own sections)',
        'Assessments': 'CRUD (own)',
        'Results': 'Propose',
        'Transcripts': 'Read',
        'Requests': 'Read',
      },
    },
    {
      name: 'Student',
      description: 'View-only access to own records, can create requests',
      permissions: {
        'Admissions': 'Apply/View',
        'Enrollment': 'View',
        'Attendance': 'View',
        'Assessments': 'View',
        'Results': 'View',
        'Transcripts': 'Request',
        'Requests': 'Create',
      },
    },
    {
      name: 'ExamCell',
      description: 'Manages exam results publication and freezing',
      permissions: {
        'Admissions': 'Read',
        'Enrollment': 'Read',
        'Attendance': 'Read',
        'Assessments': 'Read',
        'Results': 'Publish/Freeze',
        'Transcripts': 'Issue',
        'Requests': 'Read',
      },
    },
    {
      name: 'Finance',
      description: 'Manages fee plans, vouchers, payments, and financial reports',
      permissions: {
        'Finance': 'Full Access',
        'Students': 'Read (for finance records)',
      },
    },
  ]

  const getPermissionBadgeVariant = (permission: string) => {
    if (permission.includes('CRUD') || permission.includes('Full')) {
      return 'success'
    }
    if (permission.includes('Approve') || permission.includes('Publish') || permission.includes('Issue')) {
      return 'info'
    }
    if (permission.includes('Create') || permission.includes('Apply')) {
      return 'warning'
    }
    return 'secondary'
  }

  return (
    <DashboardLayout>
      <PageShell 
        title="Roles & Permissions"
        description="View role-based access control (RBAC) permissions"
      >
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions Matrix</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admissions
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enrollment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assessments
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Results
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transcripts
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requests
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roles.map((role) => (
                      <tr key={role.name}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{role.name}</div>
                            <div className="text-xs text-gray-500">{role.description}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant={getPermissionBadgeVariant(role.permissions['Admissions'] || '')}>
                            {role.permissions['Admissions'] || '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant={getPermissionBadgeVariant(role.permissions['Enrollment'] || '')}>
                            {role.permissions['Enrollment'] || '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant={getPermissionBadgeVariant(role.permissions['Attendance'] || '')}>
                            {role.permissions['Attendance'] || '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant={getPermissionBadgeVariant(role.permissions['Assessments'] || '')}>
                            {role.permissions['Assessments'] || '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant={getPermissionBadgeVariant(role.permissions['Results'] || '')}>
                            {role.permissions['Results'] || '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant={getPermissionBadgeVariant(role.permissions['Transcripts'] || '')}>
                            {role.permissions['Transcripts'] || '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant={getPermissionBadgeVariant(role.permissions['Requests'] || '')}>
                            {role.permissions['Requests'] || '-'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-md font-semibold text-gray-900">Permission Abbreviations</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-900">CRUD</dt>
                  <dd className="text-gray-600">Create, Read, Update, Delete (full access)</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">Read / View</dt>
                  <dd className="text-gray-600">Read-only access</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">Approve / Publish</dt>
                  <dd className="text-gray-600">Can approve or publish records</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">Create / Apply</dt>
                  <dd className="text-gray-600">Can create new records or apply</dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-md font-semibold text-gray-900 mb-2">Important Notes</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Role permissions are enforced at the backend API level</li>
                <li>Changes to Results post-publish require approval and create an audit trail</li>
                <li>Faculty can only manage attendance and assessments for their assigned sections</li>
                <li>Students can only view their own records</li>
                <li>Role assignments are managed via Django Admin or user groups</li>
              </ul>
            </div>
          </Card>
        </div>
      </PageShell>
    </DashboardLayout>
  )
}
