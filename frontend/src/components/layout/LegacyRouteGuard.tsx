import React from 'react'
import { useLocation } from 'react-router-dom'
import { isLegacyRoute } from '@/config/navConfig'

interface LegacyRouteGuardProps {
  children: React.ReactNode
}

/**
 * LegacyRouteGuard component
 * 
 * Wraps legacy routes to show a warning banner and disable mutation actions.
 * Legacy routes are deprecated and should not be used for new development.
 */
export const LegacyRouteGuard: React.FC<LegacyRouteGuardProps> = ({ children }) => {
  const location = useLocation()
  const isLegacy = isLegacyRoute(location.pathname)

  if (!isLegacy) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Legacy Warning Banner */}
      <div className="bg-red-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h2 className="font-bold text-lg">LEGACY MODULE - DO NOT USE</h2>
            <p className="text-sm opacity-90">
              This module is deprecated and should not be used for new development.
              Please use the canonical modules instead. See{' '}
              <a
                href="/docs/CANONICAL_MODULES.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold hover:opacity-80"
              >
                Canonical Modules Documentation
              </a>
              {' '}for details.
            </p>
          </div>
        </div>
      </div>

      {/* Disable mutation actions via CSS and JS */}
      <div className="legacy-route-content">
        {children}
        <style>{`
          .legacy-route-content button[type="submit"],
          .legacy-route-content form button[type="submit"],
          .legacy-route-content button:not([type="button"]):not([disabled]) {
            pointer-events: none;
            opacity: 0.5;
            cursor: not-allowed;
          }
          .legacy-route-content input[type="submit"],
          .legacy-route-content button[type="submit"] {
            pointer-events: none;
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  )
}
