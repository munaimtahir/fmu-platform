import React, { useState, useEffect } from 'react'
import { Sidebar } from '../layout/Sidebar'
import { Topbar } from '../layout/Topbar'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { ImpersonationBanner } from '../admin/ImpersonationBanner'

export interface DashboardLayoutProps {
  /** The content to be rendered within the layout. */
  children: React.ReactNode
}

/**
 * `DashboardLayout` provides the main structure for the application's dashboard.
 *
 * This component includes a responsive sidebar and a top bar, creating a
 * consistent and user-friendly layout for all dashboard pages. It manages
 * the state of the sidebar (open/closed) and adapts to different screen sizes.
 *
 * @component
 * @param {DashboardLayoutProps} props The props for the component.
 * @param {React.ReactNode} props.children The content to be rendered inside the layout.
 * @returns {React.ReactElement} The rendered `DashboardLayout` component.
 *
 * @example
 * <DashboardLayout>
 *   <p>This is the dashboard content.</p>
 * </DashboardLayout>
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
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
    <div className="min-h-screen bg-[#FAFAFA] flex">
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
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
