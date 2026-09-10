import React from 'react'
import { Badge } from './Badge'
import { statusVariant, StatusDomain } from '@/lib/statusBadges'

export interface StatusBadgeProps {
  domain: StatusDomain
  status: string | null | undefined
  /** Override the rendered label; defaults to the raw status string. */
  label?: string
  className?: string
  'data-testid'?: string
}

/**
 * Renders a status as a Badge using the centralized domain registry
 * (`@/lib/statusBadges`), so every screen showing a given domain's status
 * uses the same color for the same value.
 *
 * @example
 * <StatusBadge domain="student" status={student.status} />
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  domain,
  status,
  label,
  className,
  'data-testid': dataTestId,
}) => (
  <Badge variant={statusVariant(domain, status)} className={className} data-testid={dataTestId}>
    {label ?? status ?? '—'}
  </Badge>
)
