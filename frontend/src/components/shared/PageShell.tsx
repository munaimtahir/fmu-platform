import React from 'react'

interface PageShellProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  breadcrumbs?: Array<{ label: string; path?: string }>
}

/**
 * PageShell - Consistent page layout wrapper
 * Provides title, description, actions, and optional breadcrumbs
 */
export const PageShell: React.FC<PageShellProps> = ({
  title,
  description,
  actions,
  children,
  breadcrumbs,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="text-sm text-gray-500 mb-2" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && (
                      <svg
                        className="w-4 h-4 mx-2 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                    {crumb.path ? (
                      <a href={crumb.path} className="hover:text-gray-700">
                        {crumb.label}
                      </a>
                    ) : (
                      <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}>
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        {children}
      </div>
    </div>
  )
}
