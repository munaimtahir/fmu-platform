import React, { forwardRef, useRef, useState } from 'react'

interface FileUploadProps {
  id?: string
  label?: string
  error?: string
  helperText?: string
  onChange: (files: FileList | null) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  required?: boolean
  maxSize?: number // in bytes
  className?: string
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      onChange,
      accept,
      multiple = false,
      disabled = false,
      required = false,
      maxSize,
      className = '',
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFiles = (fileList: FileList | null) => {
      if (!fileList) return

      const filesArray = Array.from(fileList)
      
      // Check file sizes if maxSize is provided
      if (maxSize) {
        const oversizedFiles = filesArray.filter(file => file.size > maxSize)
        if (oversizedFiles.length > 0) {
          alert(`Some files exceed the maximum size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`)
          return
        }
      }

      setFiles(filesArray)
      onChange(fileList)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragging(true)
      }
    }

    const handleDragLeave = () => {
      setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      
      if (!disabled) {
        handleFiles(e.dataTransfer.files)
      }
    }

    const handleClick = () => {
      if (!disabled && inputRef.current) {
        inputRef.current.click()
      }
    }

    const handleRemove = (index: number) => {
      const newFiles = files.filter((_, i) => i !== index)
      setFiles(newFiles)
      
      // Create a new FileList-like object
      const dt = new DataTransfer()
      newFiles.forEach(file => dt.items.add(file))
      onChange(dt.files)
    }

    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / 1024 / 1024).toFixed(1) + ' MB'
    }

    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-150 cursor-pointer
            ${isDragging ? 'border-[#3B82F6] bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${error ? 'border-red-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          `}
        >
          <input
            ref={ref || inputRef}
            id={id}
            type="file"
            onChange={handleChange}
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            required={required}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-2">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-[#3B82F6]">Click to upload</span> or drag and drop
            </div>
            {accept && (
              <p className="text-xs text-gray-500">
                Accepted formats: {accept}
              </p>
            )}
            {maxSize && (
              <p className="text-xs text-gray-500">
                Max file size: {(maxSize / 1024 / 1024).toFixed(2)}MB
              </p>
            )}
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(index)
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-150"
                  aria-label="Remove file"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {!error && helperText && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    )
  }
)

FileUpload.displayName = 'FileUpload'
