import { forwardRef, useState, useRef, useEffect } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  id?: string
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  required?: boolean
  className?: string
  'data-testid'?: string
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      options,
      value,
      onChange,
      placeholder = 'Select an option...',
      disabled = false,
      searchable = true,
      required = false,
      className = '',
      'data-testid': dataTestId,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const selectedOption = options.find((opt) => opt.value === value)

    const filteredOptions = searchable
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
          setSearchTerm('')
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])

    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, [isOpen, searchable])

    const handleSelect = (optionValue: string) => {
      onChange(optionValue)
      setIsOpen(false)
      setSearchTerm('')
    }

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen)
      }
    }

    return (
      <div className={className} ref={ref}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-ink-secondary mb-1">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        <div ref={containerRef} className="relative">
          <button
            id={id}
            data-testid={dataTestId}
            type="button"
            onClick={handleToggle}
            disabled={disabled}
            className={`
              w-full px-4 py-3 text-left rounded-2xl border transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent
              disabled:bg-surface disabled:text-ink-muted disabled:cursor-not-allowed
              ${error ? 'border-danger' : 'border-surface-border hover:border-ink-muted'}
              ${isOpen ? 'ring-2 ring-primary-600' : ''}
            `}
          >
            <div className="flex items-center justify-between">
              <span className={selectedOption ? 'text-ink-primary' : 'text-ink-muted'}>
                {selectedOption?.label || placeholder}
              </span>
              <svg
                className={`w-5 h-5 text-ink-muted transition-transform duration-150 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {isOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl border border-surface-border shadow-elevation-3 max-h-60 overflow-hidden">
              {searchable && (
                <div className="p-2 border-b border-surface-border">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-3 py-2 rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm"
                  />
                </div>
              )}

              <div className="overflow-y-auto max-h-48">
                {filteredOptions.length > 0 ? (
                  <ul>
                    {filteredOptions.map((option) => (
                      <li key={option.value}>
                        <button
                          type="button"
                          onClick={() => handleSelect(option.value)}
                          className={`
                            w-full text-left px-4 py-2.5 transition-colors duration-150
                            ${
                              option.value === value
                                ? 'bg-primary-600 text-white'
                                : 'text-ink-primary hover:bg-surface'
                            }
                          `}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-center text-ink-muted text-sm">
                    No options found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-1 text-body-sm text-danger">{error}</p>}
        {!error && helperText && <p className="mt-1 text-body-sm text-ink-muted">{helperText}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
