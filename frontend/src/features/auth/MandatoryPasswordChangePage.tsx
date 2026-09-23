import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { changePassword } from '@/api/auth'
import { apiErrorMessage } from '@/lib/apiErrors'
import { useAuthStore } from './authStore'

export function MandatoryPasswordChangePage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const logout = useAuthStore((state) => state.logout)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (newPassword !== confirm) {
      setError('New passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const result = await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: confirm,
      })
      setUser(result.user)
      navigate('/student/onboarding', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Password change failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <h1 className="text-h1 text-ink-primary mb-2">Change your temporary password</h1>
        <p className="text-ink-secondary mb-6">This security step is required before you can use the student application.</p>
        {error && <Alert variant="error">{error}</Alert>}
        <form onSubmit={submit} className="space-y-4 mt-4">
          <Input label="Temporary password" type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
          <Input label="New password" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Input label="Confirm new password" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <div className="flex gap-3">
            <Button type="submit" isLoading={loading}>Change password</Button>
            <Button type="button" variant="secondary" onClick={logout}>Log out</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
