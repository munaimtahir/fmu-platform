import React from 'react'
import { useCapabilities } from '@/features/auth/useCapabilities'
import type { RoleName } from '@/features/auth/access'

export interface CanProps {
  /** Render children when the user holds ANY of these task codes. */
  tasks?: readonly string[]
  /** Or when the user has ANY of these roles (self-service controls only). */
  roles?: readonly RoleName[]
  /** Rendered instead of `children` when access is denied. */
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Show a control only to users who hold the matching backend task codes.
 * With neither `tasks` nor `roles` it renders for every signed-in user.
 */
export const Can: React.FC<CanProps> = ({ tasks, roles, fallback = null, children }) => {
  const { allows } = useCapabilities()
  return <>{allows({ tasks, roles }) ? children : fallback}</>
}
