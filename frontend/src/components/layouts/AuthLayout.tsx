import React from 'react'
import { Card } from '../ui/Card'

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-600 text-lg">
              {subtitle}
            </p>
          )}
        </div>
        
        <Card padding="lg" className="shadow-xl">
          {children}
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Student Information Management System
          </p>
        </div>
      </div>
    </div>
  )
}
