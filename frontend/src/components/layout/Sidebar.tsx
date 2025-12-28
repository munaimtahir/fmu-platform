import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'

interface NavItem {
  label: string
  path: string
  icon: string
  roles?: string[]
}

const navigationItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊', roles: [] },
  { label: 'Analytics', path: '/analytics', icon: '📈', roles: ['Admin'] },
  { label: 'Students', path: '/students', icon: '👥', roles: ['Admin', 'Registrar'] },
  { label: 'Courses', path: '/courses', icon: '📚', roles: ['Admin', 'Registrar', 'Faculty'] },
  { label: 'Sections', path: '/sections', icon: '🏫', roles: ['Admin', 'Registrar', 'Faculty'] },
  { label: 'Bulk Enrollment', path: '/enrollment/bulk', icon: '📝', roles: ['Admin', 'Registrar'] },
  { label: 'Assessments', path: '/assessments', icon: '📋', roles: ['Admin', 'Faculty'] },
  { label: 'Attendance', path: '/attendance', icon: '✅', roles: ['Admin', 'Faculty'] },
  { label: 'Bulk Attendance', path: '/attendance/bulk', icon: '✏️', roles: ['Admin', 'Faculty'] },
  { label: 'Gradebook', path: '/gradebook', icon: '📖', roles: ['Admin', 'Faculty', 'Student'] },
  { label: 'DataTable Demo', path: '/demo/datatable', icon: '🧪', roles: [] },
]

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  isMobile?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, isMobile = false }) => {
  const location = useLocation()
  const { user } = useAuth()

  const canAccessItem = (item: NavItem): boolean => {
    if (!item.roles || item.roles.length === 0) return true
    if (!user || !user.role) return false
    return item.roles.includes(user.role)
  }

  const filteredItems = navigationItems.filter(canAccessItem)

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-150"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen bg-[#0F172A] text-white z-50
          transition-all duration-150 ease-in-out
          ${isOpen ? 'w-64' : 'w-20'}
          ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : ''}
          flex flex-col
        `}
        aria-label="Main navigation"
      >
        {/* Logo/Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          {isOpen ? (
            <h1 className="text-xl font-bold">SIMS</h1>
          ) : (
            <span className="text-xl font-bold">S</span>
          )}
          <button
            onClick={onToggle}
            className="lg:block hidden p-2 rounded-lg hover:bg-gray-700 transition-colors duration-150"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4" aria-label="Primary navigation">
          <ul className="space-y-1 px-2">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-2xl
                      transition-all duration-150
                      ${isActive 
                        ? 'bg-[#3B82F6] text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                      ${!isOpen && 'justify-center'}
                    `}
                    aria-current={isActive ? 'page' : undefined}
                    title={!isOpen ? item.label : undefined}
                  >
                    <span className="text-xl" aria-hidden="true">{item.icon}</span>
                    {isOpen && (
                      <span className="font-medium truncate">{item.label}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Info Footer */}
        {user && isOpen && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center font-medium text-white">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.full_name || user.email}
                </p>
                {user.role && (
                  <p className="text-xs text-gray-400 truncate">
                    {user.role}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
