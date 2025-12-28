/**
 * Section Form Component
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { sectionsService } from '@/services'
import { Section } from '@/types'

const sectionSchema = z.object({
  course: z.number().min(1, 'Course is required'),
  term: z.number().min(1, 'Term is required'),
  teacher: z.string().min(1, 'Teacher is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
})

type SectionFormData = z.infer<typeof sectionSchema>

interface SectionFormProps {
  section?: Section | null
  onClose: () => void
  onSuccess: () => void
}

export function SectionForm({ section, onClose, onSuccess }: SectionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: section || {
      course: 0,
      term: 0,
      teacher: '',
      capacity: 30,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: SectionFormData) =>
      section
        ? sectionsService.update(section.id, data)
        : sectionsService.create(data),
    onSuccess: () => {
      toast.success(section ? 'Section updated successfully' : 'Section created successfully')
      onSuccess()
    },
    onError: () => {
      toast.error('Failed to save section')
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
            <label className="block text-sm font-medium mb-1">Course ID</label>
            <Input
              type="number"
              {...register('course', { valueAsNumber: true })}
              error={errors.course?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Term ID</label>
            <Input
              type="number"
              {...register('term', { valueAsNumber: true })}
              error={errors.term?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teacher</label>
            <Input {...register('teacher')} error={errors.teacher?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <Input
              type="number"
              {...register('capacity', { valueAsNumber: true })}
              error={errors.capacity?.message}
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
