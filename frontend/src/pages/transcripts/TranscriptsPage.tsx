import React from 'react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'

/**
 * TranscriptsPage - Transcript management information
 * Note: Transcript generation is handled via specific endpoints
 */
export const TranscriptsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <PageShell 
        title="Transcripts"
        description="Generate and manage student transcripts"
      >
        <div className="space-y-6">
          <Alert variant="info">
            <strong>Note:</strong> Transcript generation is available through the Results and Student pages. 
            Use the transcript generation feature from individual student records.
          </Alert>

          <Card>
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Transcript Features</h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Generate transcripts for individual students</li>
                <li>Background job processing for bulk transcript generation</li>
                <li>QR code verification for transcript authenticity</li>
                <li>Email delivery of generated transcripts</li>
              </ul>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-md font-semibold text-gray-900 mb-2">How to Generate Transcripts</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Navigate to the Students page</li>
                <li>Select a student record</li>
                <li>Use the "Generate Transcript" action</li>
                <li>Transcript will be generated and can be downloaded or emailed</li>
              </ol>
            </div>
          </Card>
        </div>
      </PageShell>
    </DashboardLayout>
  )
}
