import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import type { ImportMode } from '@/types/studentImport'

interface ImportUploaderProps {
  onPreview: (file: File, mode: ImportMode, autoCreate: boolean) => void
  loading: boolean
  onReset: () => void
  onDownloadTemplate: () => Promise<void>
  importType: 'student' | 'faculty'
}

export function ImportUploader({
  onPreview,
  loading,
  onReset,
  onDownloadTemplate,
  importType,
}: ImportUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<ImportMode>('CREATE_ONLY')
  const [autoCreate, setAutoCreate] = useState<boolean>(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      onPreview(file, mode, autoCreate)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      await onDownloadTemplate()
    } catch (err: any) {
      console.error('Failed to download template:', err)
      alert('Failed to download template. Please try again.')
    }
  }

  const importTypeLabel = importType === 'student' ? 'student' : 'faculty'
  const uniqueKeyLabel = importType === 'student' ? 'reg_no' : 'email'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Import Mode
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="mode"
              value="CREATE_ONLY"
              checked={mode === 'CREATE_ONLY'}
              onChange={(e) => setMode(e.target.value as ImportMode)}
              className="mr-2"
            />
            <div>
              <div className="font-medium">Create Only</div>
              <div className="text-sm text-gray-500">
                Only create new {importTypeLabel}s. Rejects existing {uniqueKeyLabel}.
              </div>
            </div>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="mode"
              value="UPSERT"
              checked={mode === 'UPSERT'}
              onChange={(e) => setMode(e.target.value as ImportMode)}
              className="mr-2"
            />
            <div>
              <div className="font-medium">Upsert</div>
              <div className="text-sm text-gray-500">
                Create new or update existing {importTypeLabel}s by {uniqueKeyLabel}.
              </div>
            </div>
          </label>
        </div>
      </div>

      {importType === 'student' && (
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoCreate}
              onChange={(e) => setAutoCreate(e.target.checked)}
              className="mr-2"
            />
            <div>
              <div className="font-medium">Auto-create missing Programs, Batches, and Groups</div>
              <div className="text-sm text-gray-500">
                Automatically create Programs, Batches, and Groups if they don't exist in the system.
                This makes imports more flexible but requires careful batch name formatting (e.g., "2029 Batch").
              </div>
            </div>
          </label>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            CSV File
          </label>
          <Button
            type="button"
            onClick={handleDownloadTemplate}
            variant="secondary"
            className="text-sm"
          >
            Download Template
          </Button>
        </div>
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={loading}
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!file || loading}
          variant="primary"
        >
          {loading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Validating...
            </>
          ) : (
            'Preview Import'
          )}
        </Button>
        <Button type="button" onClick={onReset} variant="secondary">
          Reset
        </Button>
      </div>
    </form>
  )
}
