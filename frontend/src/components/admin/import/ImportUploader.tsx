import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

interface ImportUploaderProps {
  onPreview: (file: File) => void
  loading: boolean
  onReset: () => void
  onDownloadTemplate: () => Promise<void>
}

export function ImportUploader({
  onPreview,
  loading,
  onReset,
  onDownloadTemplate,
}: ImportUploaderProps) {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      onPreview(file)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-ink-secondary">
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
          <p className="mt-2 text-sm text-ink-secondary">
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
