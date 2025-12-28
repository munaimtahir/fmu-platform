import React from 'react'
import { Link, useLocation } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  path: string
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  students: 'Students',
  courses: 'Courses',
  enrollment: 'Enrollment',
  assessments: 'Assessments',
  results: 'Results',
  reports: 'Reports',
  admin: 'Admin',
  registrar: 'Registrar',
  faculty: 'Faculty',
  student: 'Student',
  examcell: 'Exam Cell',
}

export const Breadcrumbs: React.FC = () => {
  const location = useLocation()
  
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = location.pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []
    
    let currentPath = ''
    paths.forEach((path) => {
      currentPath += `/${path}`
      const label = routeLabels[path.toLowerCase()] || path.charAt(0).toUpperCase() + path.slice(1)
      breadcrumbs.push({ label, path: currentPath })
    })
    
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
      <Link
        to="/"
        className="text-gray-500 hover:text-[#3B82F6] transition-colors duration-150"
      >
        Home
      </Link>
      
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1
        
        return (
          <React.Fragment key={crumb.path}>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            
            {isLast ? (
              <span className="text-gray-900 font-medium" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-gray-500 hover:text-[#3B82F6] transition-colors duration-150"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
