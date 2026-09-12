import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../layout/Sidebar'
import { Topbar } from '../layout/Topbar'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { ImpersonationBanner } from '../admin/ImpersonationBanner'

/**
 * `DashboardLayout` provides the main structure for the application's dashboard.
 *
 * This is a router-level layout route: it renders the shared chrome
 * (sidebar, topbar, breadcrumbs) once and lets React Router mount the
 * active page into its `<Outlet/>`, instead of every page wrapping itself
 * in this component individually. It manages the state of the sidebar
 * (open/closed) and adapts to different screen sizes.
 *
 * @component
 * @returns {React.ReactElement} The rendered `DashboardLayout` component.
 */
export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Load sidebar state from localStorage
    const saved = localStorage.getItem('sidebarOpen')
    return saved !== null ? JSON.parse(saved) : true
  })
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen))
  }, [isSidebarOpen])

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sidebar isOpen={isMobileMenuOpen} onToggle={handleMobileMenuToggle} isMobile />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={handleMobileMenuToggle} showMenuButton />
        <ImpersonationBanner />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
