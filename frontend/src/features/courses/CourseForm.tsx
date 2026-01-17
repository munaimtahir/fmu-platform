/**
 * Course Form Component
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { coursesService } from '@/services'
import { academicsNewService } from '@/services/academicsNew'
import { academicsService } from '@/services/academics'
import { Course } from '@/types'

const courseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  name: z.string().min(1, 'Course name is required'),
  department: z.number().min(1, 'Department is required'),
  academic_period: z.number().optional(),
  credits: z.number().min(1, 'Credits must be at least 1').max(10, 'Credits cannot exceed 10'),
})

type CourseFormData = z.infer<typeof courseSchema>

interface CourseFormProps {
  course?: Course | null
  onClose: () => void
  onSuccess: () => void
}

export function CourseForm({ course, onClose, onSuccess }: CourseFormProps) {
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => academicsNewService.getDepartments(),
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
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: course || {
      code: '',
      name: '',
      department: 0,
      academic_period: undefined,
      credits: 3,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: CourseFormData) => {
      const payload: any = {
        code: data.code,
        name: data.name,
        department: data.department,
        credits: data.credits,
      }
      if (data.academic_period) {
        payload.academic_period = data.academic_period
      }
      return course
        ? coursesService.update(course.id, payload)
        : coursesService.create(payload)
    },
    onSuccess: () => {
      toast.success(course ? 'Course updated successfully' : 'Course created successfully')
      onSuccess()
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.detail || 'Failed to save course'
      toast.error(errorMessage)
    },
  })

  const onSubmit = (data: CourseFormData) => {
    mutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {course ? 'Edit Course' : 'Add Course'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Course Code</label>
            <Input {...register('code')} error={errors.code?.message} placeholder="e.g., ANAT-101" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Course Name</label>
            <Input {...register('name')} error={errors.name?.message} placeholder="e.g., Human Anatomy" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Department *</label>
            <Select
              value={watch('department') ? String(watch('department')) : ''}
              onChange={(value) => {
                const form = handleSubmit(onSubmit)
                // Update form value
                const event = { target: { value: value ? Number(value) : 0 } } as any
                register('department').onChange(event)
              }}
              options={[
                { value: '', label: 'Select a department' },
                ...(departments || []).map((dept) => ({
                  value: String(dept.id),
                  label: dept.name,
                })),
              ]}
            />
            {errors.department && (
              <p className="text-red-500 text-sm mt-1">{errors.department.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Academic Period (Optional)</label>
            <Select
              value={watch('academic_period') ? String(watch('academic_period')) : ''}
              onChange={(value) => {
                const event = { target: { value: value ? Number(value) : undefined } } as any
                register('academic_period').onChange(event)
              }}
              options={[
                { value: '', label: 'None (Optional)' },
                ...(academicPeriods || []).map((period) => ({
                  value: String(period.id),
                  label: `${period.name} (${period.period_type})`,
                })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Credits</label>
            <Input
              type="number"
              {...register('credits', { valueAsNumber: true })}
              error={errors.credits?.message}
              min="1"
              max="10"
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
