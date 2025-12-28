import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from './useAuth'

// Validation schema
const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

/**
 * LoginPage - Authentication page with form validation
 * Features: react-hook-form, zod validation, toast notifications
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('')
      setIsSubmitting(true)

      await login(data)

      toast.success('Login successful! Welcome back.', {
        duration: 3000,
        position: 'top-right',
      })

      // Navigate to dashboard
      navigate('/dashboard')
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Invalid credentials. Please check your email/username and password.'
      
      setError(errorMessage)
      
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-right',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your SIMS account"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="error" title="Authentication Failed">
            {error}
          </Alert>
        )}

        <FormField
          {...register('identifier')}
          label="Email or Username"
          type="text"
          placeholder="your.email@example.com or username"
          error={errors.identifier?.message}
          autoComplete="username"
          autoFocus
        />

        <FormField
          {...register('password')}
          label="Password"
          type="password"
          placeholder="Enter your password"
          error={errors.password?.message}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-700"
            >
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a
              href="#"
              className="font-medium text-primary hover:text-blue-600 transition-colors duration-150"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          Sign In
        </Button>

        <div className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <a
            href="#"
            className="font-medium text-primary hover:text-blue-600 transition-colors duration-150"
          >
            Contact your administrator
          </a>
        </div>
      </form>
    </AuthLayout>
  )
}
