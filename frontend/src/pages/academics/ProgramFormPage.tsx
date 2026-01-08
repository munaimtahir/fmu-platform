import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { academicsNewService } from '@/services/academicsNew'

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

  return (
    <DashboardLayout>
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
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Active
              </label>
            </div>
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
    </DashboardLayout>
  )
}

