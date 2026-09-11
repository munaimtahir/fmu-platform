import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { FormSection } from '@/components/ui/FormSection'
import { Card } from '@/components/ui/Card'
import { academicsNewService } from '@/services/academicsNew'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'

export const ProgramFormPage: React.FC = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [structureType, setStructureType] = useState<'YEARLY' | 'SEMESTER' | 'CUSTOM'>('YEARLY')
  const [periodLengthMonths, setPeriodLengthMonths] = useState<number | ''>('')
  const [totalPeriods, setTotalPeriods] = useState<number | ''>('')
  const [isActive, setIsActive] = useState(true)

  const createMutation = useMutation({
    mutationFn: (data: any) => academicsNewService.createProgram(data),
    onSuccess: (data) => {
      navigate(`/academics/programs/${data.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: any = {
      name,
      description,
      structure_type: structureType,
      is_active: isActive,
    }

    if (structureType === 'CUSTOM') {
      if (!periodLengthMonths || !totalPeriods) {
        alert('Period length and total periods are required for CUSTOM structure')
        return
      }
      data.period_length_months = Number(periodLengthMonths)
      data.total_periods = Number(totalPeriods)
    }

    createMutation.mutate(data)
  }

  const isDirty = Boolean(
    name || description || periodLengthMonths !== '' || totalPeriods !== '' || structureType !== 'YEARLY' || !isActive
  )
  useUnsavedChangesWarning(isDirty)

  return (
    
      <PageShell
        title="Create Program"
        description="Create a new academic program"
        actions={
          <Button variant="ghost" onClick={() => navigate('/academics/programs')}>
            Cancel
          </Button>
        }
      >
        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <FormSection title="Program Details">
              <Input
                label="Program Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <TextArea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </FormSection>

            <FormSection title="Structure" description="How this program's academic calendar is divided.">
              <Select
                label="Structure Type"
                value={structureType}
                onChange={(value) => setStructureType(value as 'YEARLY' | 'SEMESTER' | 'CUSTOM')}
                options={[
                  { value: 'YEARLY', label: 'Yearly' },
                  { value: 'SEMESTER', label: 'Semester' },
                  { value: 'CUSTOM', label: 'Custom' },
                ]}
                required
              />
              {structureType === 'CUSTOM' && (
                <>
                  <Input
                    label="Period Length (Months)"
                    type="number"
                    value={periodLengthMonths === '' ? '' : String(periodLengthMonths)}
                    onChange={(e) => setPeriodLengthMonths(e.target.value ? Number(e.target.value) : '')}
                    min={1}
                    required
                  />
                  <Input
                    label="Total Periods"
                    type="number"
                    value={totalPeriods === '' ? '' : String(totalPeriods)}
                    onChange={(e) => setTotalPeriods(e.target.value ? Number(e.target.value) : '')}
                    min={1}
                    required
                  />
                </>
              )}
            </FormSection>

            <FormSection title="Status">
              <Switch label="Active" checked={isActive} onChange={setIsActive} />
            </FormSection>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => navigate('/academics/programs')}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Create Program
              </Button>
            </div>
          </form>
        </Card>
      </PageShell>
    
  )
}

