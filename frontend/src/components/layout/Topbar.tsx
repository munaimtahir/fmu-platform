import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { searchService, SearchResult } from '@/services/search'
import { ImpersonationDialog } from '@/components/admin/ImpersonationDialog'

interface TopbarProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, showMenuButton = false }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isImpersonationDialogOpen, setIsImpersonationDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([])
      setIsSearchOpen(false)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const results = await searchService.search(query)
      setSearchResults(results.results)
      setIsSearchOpen(results.results.length > 0)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      setIsSearchOpen(false)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Handle search input change with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      performSearch(query)
    }, 300) // 300ms debounce
  }

  // Handle search result selection
  const handleResultSelect = (result: SearchResult) => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearchOpen(false)
    setSelectedIndex(-1)
    navigate(result.route)
    searchInputRef.current?.blur()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || searchResults.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
        // Navigate to search results page if implemented
        navigate('/students', { state: { search: searchQuery } })
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleResultSelect(searchResults[selectedIndex])
        } else if (searchResults.length > 0) {
          handleResultSelect(searchResults[0])
        }
        break
      case 'Escape':
        setIsSearchOpen(false)
        setSelectedIndex(-1)
        searchInputRef.current?.blur()
        break
    }
  }

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-16 px-4 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          
          {/* Global Search */}
          <div className="hidden md:block relative" ref={searchRef}>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] rounded-2xl w-96 border border-transparent focus-within:border-gray-300 focus-within:bg-white transition-all duration-150">
              {isSearching ? (
                <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search students, courses, sections, programs..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setIsSearchOpen(true)
                  }
                }}
                className="bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 flex-1"
              />
            </div>

            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-2xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                <div className="p-2">
                  {searchResults.map((result, index) => {
                    const getIcon = () => {
                      switch (result.type) {
                        case 'student':
                          return '👤'
                        case 'course':
                          return '📚'
                        case 'section':
                          return '📖'
                        case 'program':
                          return '🎓'
                        default:
                          return '🔍'
                      }
                    }

                    const getTypeLabel = () => {
                      switch (result.type) {
                        case 'student':
                          return 'Student'
                        case 'course':
                          return 'Course'
                        case 'section':
                          return 'Section'
                        case 'program':
                          return 'Program'
                        default:
                          return 'Result'
                      }
                    }

                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        onClick={() => handleResultSelect(result)}
                        className={`
                          w-full text-left px-4 py-3 rounded-xl transition-colors duration-150
                          ${index === selectedIndex ? 'bg-[#3B82F6] text-white' : 'text-gray-900 hover:bg-gray-100'}
                        `}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getIcon()}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium truncate ${index === selectedIndex ? 'text-white' : 'text-gray-900'}`}>
                                {result.title}
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded ${index === selectedIndex ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                {getTypeLabel()}
                              </span>
                            </div>
                            {result.subtitle && (
                              <p className={`text-xs mt-1 truncate ${index === selectedIndex ? 'text-white/80' : 'text-gray-500'}`}>
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                  <p className="text-xs text-gray-500 text-center">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Impersonation Button (Admin only) */}
          {user?.role === 'Admin' && (
            <button
              onClick={() => setIsImpersonationDialogOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
              aria-label="Impersonate user"
              title="Impersonate user"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21v-1m8 1v-1" />
              </svg>
            </button>
          )}
          
          {/* Notifications Placeholder */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 relative"
            aria-label="Notifications"
            disabled
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          {/* User Menu */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-gray-100 transition-colors duration-150"
                aria-label="User menu"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-medium text-sm">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user.full_name || user.email}
                  </p>
                  {user.role && (
                    <p className="text-xs text-gray-500">
                      {user.role}
                    </p>
                  )}
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-500 transition-transform duration-150 ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    {user.role && (
                      <p className="text-xs text-gray-500 mt-1">
                        Role: {user.role}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      navigate('/profile')
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                  >
                    My Profile
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      navigate('/profile?action=change-password')
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                  >
                    Change Password
                  </button>
                  
                  <div className="border-t border-gray-200 my-2" />
                  
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      handleLogout()
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Impersonation Dialog */}
      <ImpersonationDialog
        isOpen={isImpersonationDialogOpen}
        onClose={() => setIsImpersonationDialogOpen(false)}
      />
    </header>
  )
}
