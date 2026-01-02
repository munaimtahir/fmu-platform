import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import type { ImportMode } from '@/types/studentImport'

interface ImportUploaderProps {
  onPreview: (file: File, mode: ImportMode) => void
  loading: boolean
  onReset: () => void
}

export function ImportUploader({
  onPreview,
  loading,
  onReset,
}: ImportUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<ImportMode>('CREATE_ONLY')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      onPreview(file, mode)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Upload CSV File</h2>
        <p className="text-gray-600 mb-4">
          Upload a CSV file with student data. The file will be validated before
          import.
        </p>
      </div>

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
                Only create new students. Rejects existing reg_no.
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
                Create new or update existing students by reg_no.
              </div>
            </div>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CSV File
        </label>
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
        <Button type="button" onClick={onReset} variant="outline">
          Reset
        </Button>
      </div>
    </form>
  )
}
