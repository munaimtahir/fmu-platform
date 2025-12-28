import { forwardRef } from 'react'

interface SwitchProps {
  id?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
  error?: string
  className?: string
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ id, checked, onChange, disabled = false, label, description, error, className = '' }, ref) => {
    const handleClick = () => {
      if (!disabled) {
        onChange(!checked)
      }
    }

    return (
      <div className={className}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {label && (
              <label
                htmlFor={id}
                className={`block text-sm font-medium mb-1 ${
                  disabled ? 'text-gray-400' : 'text-gray-700'
                }`}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-gray-500 mb-2">{description}</p>
            )}
          </div>
          
          <button
            ref={ref}
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={handleClick}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full
              transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2
              ${checked ? 'bg-[#3B82F6]' : 'bg-gray-200'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-150
                ${checked ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Switch.displayName = 'Switch'
