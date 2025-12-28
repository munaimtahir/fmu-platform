/**
 * Course Form Component
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { coursesService } from '@/services'
import { Course } from '@/types'

const courseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  title: z.string().min(1, 'Title is required'),
  credits: z.number().min(1, 'Credits must be at least 1').max(10, 'Credits cannot exceed 10'),
  program: z.string().min(1, 'Program is required'),
})

type CourseFormData = z.infer<typeof courseSchema>

interface CourseFormProps {
  course?: Course | null
  onClose: () => void
  onSuccess: () => void
}

export function CourseForm({ course, onClose, onSuccess }: CourseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: course || {
      code: '',
      title: '',
      credits: 3,
      program: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: CourseFormData) =>
      course
        ? coursesService.update(course.id, data)
        : coursesService.create(data),
    onSuccess: () => {
      toast.success(course ? 'Course updated successfully' : 'Course created successfully')
      onSuccess()
    },
    onError: () => {
      toast.error('Failed to save course')
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
            <Input {...register('code')} error={errors.code?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input {...register('title')} error={errors.title?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Credits</label>
            <Input
              type="number"
              {...register('credits', { valueAsNumber: true })}
              error={errors.credits?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Program</label>
            <Input {...register('program')} error={errors.program?.message} />
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
