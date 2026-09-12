import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Switch } from '@/components/ui/Switch'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import { LoadingState } from '@/components/shared/LoadingState'
import { settingsApi, type AllowedKey } from '@/api/settings'
import { academicsNewService } from '@/services/academicsNew'

interface SettingRowProps {
  keyInfo: AllowedKey
  currentValue: any
  isSaving: boolean
  programs?: Array<{ id: number; name: string }>
  onSave: (keyInfo: AllowedKey, value: any) => void
}

/**
 * One editable setting row. Extracted to its own component so each row's
 * "pending edit" state (`localValue`) is a real `useState` at the top of a
 * component, rather than inside a `.map()` callback (which previously
 * violated the Rules of Hooks by calling `useState` a variable number of
 * times per render).
 */
const SettingRow: React.FC<SettingRowProps> = ({ keyInfo, currentValue, isSaving, programs, onSave }) => {
  const [localValue, setLocalValue] = useState(currentValue)
  const fieldId = `setting-${keyInfo.key}`
  const fieldLabel = keyInfo.key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <div className="border-b border-surface-border pb-4 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Label htmlFor={fieldId}>{fieldLabel}</Label>
          <p className="text-sm text-ink-muted mb-3">{keyInfo.description}</p>

          {keyInfo.type === 'boolean' && (
            <Switch
              id={fieldId}
              checked={localValue as boolean}
              onChange={(checked) => {
                setLocalValue(checked)
                onSave(keyInfo, checked)
              }}
              disabled={isSaving}
            />
          )}

          {keyInfo.type === 'integer' && (
            <div className="flex gap-2">
              {keyInfo.key === 'default_academic_year_id' ? (
                <Select
                  id={fieldId}
                  value={localValue?.toString() || ''}
                  onChange={(value) => {
                    const val = value ? Number(value) : null
                    setLocalValue(val)
                  }}
                  disabled={isSaving}
                  className="flex-1"
                  options={[
                    { value: '', label: 'Select Academic Year' },
                    ...(programs?.map((p) => ({
                      value: p.id.toString(),
                      label: p.name,
                    })) || []),
                  ]}
                />
              ) : (
                <Input
                  id={fieldId}
                  type="number"
                  value={localValue as number}
                  onChange={(e) => setLocalValue(Number(e.target.value))}
                  disabled={isSaving}
                  className="flex-1"
                />
              )}
              <Button onClick={() => onSave(keyInfo, localValue)} disabled={isSaving || localValue === currentValue}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}

          {keyInfo.type === 'string' && (
            <div className="space-y-2">
              {keyInfo.key === 'ui_banner_message' ? (
                <TextArea
                  id={fieldId}
                  value={localValue as string}
                  onChange={(e) => setLocalValue(e.target.value)}
                  disabled={isSaving}
                  rows={3}
                />
              ) : (
                <Input
                  id={fieldId}
                  value={localValue as string}
                  onChange={(e) => setLocalValue(e.target.value)}
                  disabled={isSaving}
                />
              )}
              <Button onClick={() => onSave(keyInfo, localValue)} disabled={isSaving || localValue === currentValue}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Admin Settings Page - Configure system settings
 */
export const AdminSettingsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())

  // Fetch allowed keys and current settings
  const { data: allowedKeys, isLoading: keysLoading } = useQuery({
    queryKey: ['settings-allowed-keys'],
    queryFn: () => settingsApi.getAllowedKeys(),
  })

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings-all'],
    queryFn: () => settingsApi.getAll(),
  })

  const settings = settingsData?.results || []
  const settingsMap = new Map(settings.map((s) => [s.key, s]))

  // Fetch programs for academic year dropdown
  const { data: programs } = useQuery({
    queryKey: ['academics-programs'],
    queryFn: () => academicsNewService.getPrograms({ is_active: true }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ key, value, type }: { key: string; value: any; type: string }) =>
      settingsApi.update(key, { value_json: value, value_type: type as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-all'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: ({ key, value, type }: { key: string; value: any; type: string }) =>
      settingsApi.create({ key, value_json: value, value_type: type as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-all'] })
    },
  })

  const handleSave = async (keyInfo: AllowedKey, value: any) => {
    setSavingKeys((prev) => new Set(prev).add(keyInfo.key))
    try {
      const existing = settingsMap.get(keyInfo.key)
      if (existing) {
        await updateMutation.mutateAsync({
          key: keyInfo.key,
          value,
          type: keyInfo.type,
        })
      } else {
        await createMutation.mutateAsync({
          key: keyInfo.key,
          value,
          type: keyInfo.type,
        })
      }
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev)
        next.delete(keyInfo.key)
        return next
      })
    }
  }

  const getCurrentValue = (keyInfo: AllowedKey): any => {
    const setting = settingsMap.get(keyInfo.key)
    return setting ? setting.value_json : keyInfo.current_value ?? getDefaultValue(keyInfo.type)
  }

  const getDefaultValue = (type: string): any => {
    switch (type) {
      case 'boolean':
        return false
      case 'integer':
        return 0
      case 'string':
        return ''
      default:
        return null
    }
  }

  // Group settings by category
  const groupedKeys = (allowedKeys || []).reduce(
    (acc, keyInfo) => {
      let category = 'Other'
      if (keyInfo.key.includes('academic')) {
        category = 'Academic Defaults'
      } else if (keyInfo.key.includes('attendance')) {
        category = 'Attendance Rules'
      } else if (keyInfo.key.includes('enable')) {
        category = 'Feature Toggles'
      } else if (keyInfo.key.includes('banner')) {
        category = 'UI Messages'
      }
      if (!acc[category]) acc[category] = []
      acc[category].push(keyInfo)
      return acc
    },
    {} as Record<string, AllowedKey[]>
  )

  if (keysLoading || settingsLoading) {
    return (
      
        <PageShell title="System Settings" description="Configure system behavior">
          <LoadingState />
        </PageShell>
      
    )
  }

  return (
    
      <PageShell title="System Settings" description="Configure system behavior">
        <div className="space-y-6">
          {Object.entries(groupedKeys).map(([category, keys]) => (
            <Card key={category}>
              <div className="p-6">
                <h2 className="text-h4 text-ink-primary mb-4">{category}</h2>
                <div className="space-y-6">
                  {keys.map((keyInfo) => (
                    <SettingRow
                      key={keyInfo.key}
                      keyInfo={keyInfo}
                      currentValue={getCurrentValue(keyInfo)}
                      isSaving={savingKeys.has(keyInfo.key)}
                      programs={programs}
                      onSave={handleSave}
                    />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </PageShell>
    
  )
}
