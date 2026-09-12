import React, { forwardRef, useState } from 'react'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  showCharCount?: boolean
  maxLength?: number
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, showCharCount = false, maxLength, ...props }, ref) => {
    const [charCount, setCharCount] = useState(props.value?.toString().length || 0)

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      if (props.onChange) {
        props.onChange(e)
      }
    }

    return (
      <div className={props.className || ''}>
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-ink-secondary mb-1">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          {...props}
          className={`
            w-full px-4 py-3 rounded-2xl border transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent
            disabled:bg-surface disabled:text-ink-muted disabled:cursor-not-allowed
            ${error 
              ? 'border-danger focus:ring-danger' 
              : 'border-surface-border hover:border-ink-muted'
            }
          `}
          maxLength={maxLength}
          onChange={handleChange}
        />
        
        <div className="flex justify-between items-center mt-1">
          <div className="flex-1">
            {error && (
              <p className="text-sm text-danger">{error}</p>
            )}
            {!error && helperText && (
              <p className="text-sm text-ink-muted">{helperText}</p>
            )}
          </div>
          
          {showCharCount && (
            <p className="text-sm text-ink-muted">
              {charCount}
              {maxLength && ` / ${maxLength}`}
            </p>
          )}
        </div>
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'
