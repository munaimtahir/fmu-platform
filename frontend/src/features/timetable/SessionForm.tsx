/**
 * Session Form Component
 */
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { sessionsService, academicsService } from '@/services'
import { Session } from '@/types'

const sessionSchema = z.object({
  academic_period: z.string().min(1, 'Academic period is required'),
  group: z.string().min(1, 'Group is required'),
  faculty: z.string().min(1, 'Faculty is required'),
  department: z.string().min(1, 'Department is required'),
  starts_at: z.string().min(1, 'Start time is required'),
  ends_at: z.string().min(1, 'End time is required'),
}).refine((data) => {
  const start = new Date(data.starts_at)
  const end = new Date(data.ends_at)
  return end > start
}, {
  message: 'End time must be after start time',
  path: ['ends_at'],
})

type SessionFormData = z.infer<typeof sessionSchema>

interface SessionFormProps {
  session?: Session | null
  onClose: () => void
  onSuccess: () => void
}

export function SessionForm({ session, onClose, onSuccess }: SessionFormProps) {
  const [selectedAcademicPeriod, setSelectedAcademicPeriod] = useState<string>('')

  // Fetch dropdown data
  const { data: academicPeriods } = useQuery({
    queryKey: ['academicPeriods'],
    queryFn: () => academicsService.getAcademicPeriods(),
  })

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => academicsService.getGroups(),
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => academicsService.getDepartments(),
  })

  const { data: facultyUsers } = useQuery({
    queryKey: ['facultyUsers'],
    queryFn: () => academicsService.getFacultyUsers(),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: session ? {
      academic_period: String(session.academic_period),
      group: String(session.group),
      faculty: String(session.faculty),
      department: String(session.department),
      starts_at: session.starts_at ? new Date(session.starts_at).toISOString().slice(0, 16) : '',
      ends_at: session.ends_at ? new Date(session.ends_at).toISOString().slice(0, 16) : '',
    } : {
      academic_period: '',
      group: '',
      faculty: '',
      department: '',
      starts_at: '',
      ends_at: '',
    },
  })

  // Set default values when session changes
  useEffect(() => {
    if (session) {
      setValue('academic_period', String(session.academic_period))
      setValue('group', String(session.group))
      setValue('faculty', String(session.faculty))
      setValue('department', String(session.department))
      setSelectedAcademicPeriod(String(session.academic_period))
      if (session.starts_at) {
        setValue('starts_at', new Date(session.starts_at).toISOString().slice(0, 16))
      }
      if (session.ends_at) {
        setValue('ends_at', new Date(session.ends_at).toISOString().slice(0, 16))
      }
    }
  }, [session, setValue])

  const mutation = useMutation({
    mutationFn: (data: SessionFormData) => {
      const sessionData = {
        academic_period: parseInt(data.academic_period, 10),
        group: parseInt(data.group, 10),
        faculty: parseInt(data.faculty, 10),
        department: parseInt(data.department, 10),
        starts_at: new Date(data.starts_at).toISOString(),
        ends_at: new Date(data.ends_at).toISOString(),
      }

      return session
        ? sessionsService.update(session.id, sessionData)
        : sessionsService.create(sessionData)
    },
    onSuccess: () => {
      toast.success(session ? 'Session updated successfully' : 'Session created successfully')
      onSuccess()
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to save session'
      toast.error(errorMessage)
    },
  })

  const onSubmit = (data: SessionFormData) => {
    mutation.mutate(data)
  }

  const academicPeriodOptions = (academicPeriods || []).map((ap) => ({
    value: String(ap.id),
    label: ap.name,
  }))

  const groupOptions = (groups || []).map((g) => ({
    value: String(g.id),
    label: g.batch_name ? `${g.name} (${g.batch_name})` : g.name,
  }))

  const departmentOptions = (departments || []).map((d) => ({
    value: String(d.id),
    label: d.code ? `${d.code} - ${d.name}` : d.name,
  }))

  const facultyOptions = (facultyUsers || []).map((f) => ({
    value: String(f.id),
    label: f.full_name || `${f.first_name} ${f.last_name}` || f.username,
  }))

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 id="session-form-title" className="text-2xl font-bold mb-4">
          {session ? 'Edit Session' : 'Add Session'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="Academic Period"
                options={academicPeriodOptions}
                value={watch('academic_period') || ''}
                onChange={(value) => {
                  setValue('academic_period', value)
                  setSelectedAcademicPeriod(value)
                }}
                error={errors.academic_period?.message}
                required
                placeholder="Select academic period..."
              />
            </div>

            <div>
              <Select
                label="Group"
                options={groupOptions}
                value={watch('group') || ''}
                onChange={(value) => setValue('group', value)}
                error={errors.group?.message}
                required
                placeholder="Select group..."
              />
            </div>

            <div>
              {facultyOptions.length > 0 ? (
                <Select
                  label="Faculty"
                  options={facultyOptions}
                  value={watch('faculty') || ''}
                  onChange={(value) => setValue('faculty', value)}
                  error={errors.faculty?.message}
                  required
                  placeholder="Select faculty..."
                />
              ) : (
                <div>
                  <label htmlFor="faculty" className="block text-sm font-medium mb-1">
                    Faculty ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="faculty"
                    type="number"
                    {...register('faculty')}
                    error={errors.faculty?.message}
                    required
                    placeholder="Enter faculty user ID"
                  />
                </div>
              )}
            </div>

            <div>
              <Select
                label="Department"
                options={departmentOptions}
                value={watch('department') || ''}
                onChange={(value) => setValue('department', value)}
                error={errors.department?.message}
                required
                placeholder="Select department..."
              />
            </div>

            <div>
              <label htmlFor="starts_at" className="block text-sm font-medium mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <Input
                id="starts_at"
                type="datetime-local"
                {...register('starts_at')}
                error={errors.starts_at?.message}
                required
              />
            </div>

            <div>
              <label htmlFor="ends_at" className="block text-sm font-medium mb-1">
                End Time <span className="text-red-500">*</span>
              </label>
              <Input
                id="ends_at"
                type="datetime-local"
                {...register('ends_at')}
                error={errors.ends_at?.message}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              aria-label="Cancel and close form"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              aria-label={session ? 'Save session changes' : 'Create new session'}
            >
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
