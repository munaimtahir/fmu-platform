import React from 'react'
import { Input, InputProps } from './Input'

export interface FormFieldProps extends InputProps {
  name: string
}

/**
 * FormField wrapper for react-hook-form integration
 * Provides consistent styling and error handling
 */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (props, ref) => {
    return <Input ref={ref} {...props} />
  }
)

FormField.displayName = 'FormField'
