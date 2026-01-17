/**
 * Section Form Component
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { sectionsService } from '@/services'
import { coursesService } from '@/services'
import { academicsService } from '@/services/academics'
import { Section } from '@/types'

const sectionSchema = z.object({
  course: z.number().min(1, 'Course is required'),
  academic_period: z.number().min(1, 'Academic period is required'),
  name: z.string().min(1, 'Section name is required'),
  faculty: z.number().optional(),
  group: z.number().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
})

type SectionFormData = z.infer<typeof sectionSchema>

interface SectionFormProps {
  section?: Section | null
  onClose: () => void
  onSuccess: () => void
}

export function SectionForm({ section, onClose, onSuccess }: SectionFormProps) {
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesService.getAll(),
  })

  const { data: academicPeriods } = useQuery({
    queryKey: ['academic-periods'],
    queryFn: () => academicsService.getAcademicPeriods(),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: section || {
      course: 0,
      academic_period: 0,
      name: '',
      faculty: undefined,
      group: undefined,
      capacity: 30,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: SectionFormData) => {
      const payload: any = {
        course: data.course,
        academic_period: data.academic_period,
        name: data.name,
        capacity: data.capacity,
      }
      if (data.faculty) {
        payload.faculty = data.faculty
      }
      if (data.group) {
        payload.group = data.group
      }
      return section
        ? sectionsService.update(section.id, payload)
        : sectionsService.create(payload)
    },
    onSuccess: () => {
      toast.success(section ? 'Section updated successfully' : 'Section created successfully')
      onSuccess()
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.detail || 'Failed to save section'
      toast.error(errorMessage)
    },
  })

  const onSubmit = (data: SectionFormData) => {
    mutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {section ? 'Edit Section' : 'Add Section'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Course *</label>
            <Select
              value={watch('course') ? String(watch('course')) : ''}
              onChange={(value) => {
                const event = { target: { value: value ? Number(value) : 0 } } as any
                register('course').onChange(event)
              }}
              options={[
                { value: '', label: 'Select a course' },
                ...(courses?.results || []).map((course) => ({
                  value: String(course.id),
                  label: `${course.code} - ${course.name || course.title || ''}`,
                })),
              ]}
            />
            {errors.course && (
              <p className="text-red-500 text-sm mt-1">{errors.course.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Academic Period *</label>
            <Select
              value={watch('academic_period') ? String(watch('academic_period')) : ''}
              onChange={(value) => {
                const event = { target: { value: value ? Number(value) : 0 } } as any
                register('academic_period').onChange(event)
              }}
              options={[
                { value: '', label: 'Select an academic period' },
                ...(academicPeriods || []).map((period) => ({
                  value: String(period.id),
                  label: `${period.name} (${period.period_type})`,
                })),
              ]}
            />
            {errors.academic_period && (
              <p className="text-red-500 text-sm mt-1">{errors.academic_period.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Section Name *</label>
            <Input
              {...register('name')}
              error={errors.name?.message}
              placeholder="e.g., Section A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Capacity *</label>
            <Input
              type="number"
              {...register('capacity', { valueAsNumber: true })}
              error={errors.capacity?.message}
              min="1"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
