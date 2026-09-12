import React from 'react'
import { Card } from '../ui/Card'
import { branding } from '@/config/branding'

export interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

/**
 * AuthLayout - Centered card layout for login and authentication pages
 * Features: Minimalist-Elite aesthetic with generous whitespace
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title, 
  subtitle 
}) => {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-display text-ink-primary mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-ink-secondary text-lg">
              {subtitle}
            </p>
          )}
        </div>
        
        <Card padding="lg" className="shadow-xl">
          {children}
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-ink-muted">
            {branding.institutionName} · Powered by {branding.platformName}
          </p>
        </div>
      </div>
    </div>
  )
}
