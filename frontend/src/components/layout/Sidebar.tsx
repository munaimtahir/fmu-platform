import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { navigationConfig, isNavGroup, type NavigationItem, type NavGroup, type NavItem } from '@/config/navConfig'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  isMobile?: boolean
}

/**
 * Check if user can access navigation item based on roles
 */
function canAccessItem(item: NavigationItem, userRole: string | undefined): boolean {
  const roles = isNavGroup(item) ? item.roles : item.roles
  
  if (!roles || roles.length === 0) return true
  if (!userRole) return false
  return roles.includes(userRole)
}

/**
 * Check if any subitem in a group is accessible
 */
function hasAccessibleSubItems(group: NavGroup, userRole: string | undefined): boolean {
  return group.items.some(item => {
    if (!item.roles || item.roles.length === 0) return true
    if (!userRole) return false
    return item.roles.includes(userRole)
  })
}

/**
 * Check if a path matches or is a child of the given path
 */
function isActivePath(currentPath: string, targetPath: string): boolean {
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}

/**
 * Sidebar component with grouped navigation and collapsible submenus
 */
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, isMobile = false }) => {
  const location = useLocation()
  const { user } = useAuth()
  const userRole = user?.role

  // Load expanded groups from localStorage
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    const saved = localStorage.getItem('sidebarExpandedGroups')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })

  // Persist expanded groups to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarExpandedGroups', JSON.stringify(Array.from(expandedGroups)))
  }, [expandedGroups])

  // Auto-expand groups when their subitems are active
  useEffect(() => {
    const activeGroups = new Set<string>()
    navigationConfig.forEach((item) => {
      if (isNavGroup(item)) {
        const hasActiveChild = item.items.some(subItem => 
          isActivePath(location.pathname, subItem.path)
        )
        if (hasActiveChild) {
          activeGroups.add(item.label)
        }
      }
    })
    if (activeGroups.size > 0) {
      setExpandedGroups(prev => new Set([...prev, ...activeGroups]))
    }
  }, [location.pathname])

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupLabel)) {
        next.delete(groupLabel)
      } else {
        next.add(groupLabel)
      }
      return next
    })
  }

  const filteredItems = navigationConfig.filter(item => {
    if (isNavGroup(item)) {
      // Show group if user can access it or any of its subitems
      return canAccessItem(item, userRole) || hasAccessibleSubItems(item, userRole)
    }
    return canAccessItem(item, userRole)
  })

  const renderNavItem = (item: NavItem) => {
    const isActive = isActivePath(location.pathname, item.path)
    
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
          <span className="text-xl flex-shrink-0" aria-hidden="true">{item.icon}</span>
          {isOpen && (
            <span className="font-medium truncate">{item.label}</span>
          )}
        </Link>
      </li>
    )
  }

  const renderNavGroup = (group: NavGroup) => {
    const isExpanded = expandedGroups.has(group.label)
    const hasActiveChild = group.items.some(item => 
      isActivePath(location.pathname, item.path)
    )
    
    // Filter subitems by role
    const accessibleSubItems = group.items.filter(item => {
      if (!item.roles || item.roles.length === 0) return true
      if (!userRole) return false
      return item.roles.includes(userRole)
    })

    if (accessibleSubItems.length === 0) {
      return null
    }

    return (
      <li key={group.label}>
        {/* Group Header */}
        <button
          onClick={() => toggleGroup(group.label)}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl
            transition-all duration-150
            ${hasActiveChild
              ? 'bg-gray-800 text-white' 
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }
            ${!isOpen && 'justify-center'}
          `}
          title={!isOpen ? group.label : undefined}
        >
          <span className="text-xl flex-shrink-0" aria-hidden="true">{group.icon}</span>
          {isOpen && (
            <>
              <span className="font-medium truncate flex-1 text-left">{group.label}</span>
              <svg
                className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>

        {/* Submenu */}
        {isOpen && isExpanded && (
          <ul className="mt-1 ml-4 space-y-1 border-l-2 border-gray-700 pl-4">
            {accessibleSubItems.map((subItem) => {
              const isActive = isActivePath(location.pathname, subItem.path)
              
              return (
                <li key={subItem.path}>
                  <Link
                    to={subItem.path}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-xl
                      transition-all duration-150 text-sm
                      ${isActive
                        ? 'bg-[#3B82F6] text-white shadow-md' 
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                    <span className="truncate">{subItem.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </li>
    )
  }

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
              if (isNavGroup(item)) {
                return renderNavGroup(item)
              }
              return renderNavItem(item)
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
