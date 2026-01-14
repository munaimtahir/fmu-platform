/**
 * Impersonation Dialog Component
 * 
 * Modal dialog for selecting and starting user impersonation.
 */
import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/features/auth/authStore'
import { startImpersonation, searchUsers, UserSearchResult } from '@/api/impersonation'
import { setImpersonationToken } from '@/api/axios'
import { getCurrentUser } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

interface ImpersonationDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const ImpersonationDialog: React.FC<ImpersonationDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setUser, setImpersonation } = useAuthStore()

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      setError(null)
      try {
        const results = await searchUsers(query)
        setSearchResults(results)
      } catch (err) {
        setError('Failed to search users')
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleStartImpersonation = async (targetUser: UserSearchResult) => {
    setIsStarting(true)
    setError(null)

    try {
      const response = await startImpersonation(targetUser.id)
      
      // Set impersonation token
      setImpersonationToken(response.access)
      
      // Update user to target user
      const targetUserFull = await getCurrentUser()
      if (targetUserFull) {
        setUser(targetUserFull)
        setImpersonation({
          active: true,
          target: targetUserFull,
          expiresAt: Date.now() + response.expires_in * 1000,
        })
      }
      
      onClose()
      setQuery('')
      setSearchResults([])
    } catch (err: any) {
      setError(err?.message || 'Failed to start impersonation')
    } finally {
      setIsStarting(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Impersonate User</h2>
          <p className="text-sm text-gray-600 mt-1">
            Search for a user to impersonate. You will see the system as they do.
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search by username, email, or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {isSearching && (
            <div className="text-center py-8 text-gray-500">Searching...</div>
          )}

          {!isSearching && query.trim() && searchResults.length === 0 && !error && (
            <div className="text-center py-8 text-gray-500">No users found</div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleStartImpersonation(user)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-gray-600">
                        {user.username} • {user.email}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{user.role}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isStarting}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  )
}
