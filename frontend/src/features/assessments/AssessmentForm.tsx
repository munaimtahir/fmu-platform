/**
 * Assessment Form Component
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { assessmentsService } from '@/services'
import { Assessment } from '@/types'

const assessmentSchema = z.object({
  section: z.number().min(1, 'Section is required'),
  name: z.string().min(1, 'Name is required'),
  max_score: z.number().min(1, 'Max score must be at least 1'),
  weight: z.number().min(0).max(100, 'Weight must be between 0 and 100'),
})

type AssessmentFormData = z.infer<typeof assessmentSchema>

interface AssessmentFormProps {
  assessment?: Assessment | null
  onClose: () => void
  onSuccess: () => void
}

export function AssessmentForm({ assessment, onClose, onSuccess }: AssessmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: assessment || {
      section: 0,
      name: '',
      max_score: 100,
      weight: 0,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: AssessmentFormData) =>
      assessment
        ? assessmentsService.update(assessment.id, data)
        : assessmentsService.create(data),
    onSuccess: () => {
      toast.success(assessment ? 'Assessment updated successfully' : 'Assessment created successfully')
      onSuccess()
    },
    onError: () => {
      toast.error('Failed to save assessment')
    },
  })

  const onSubmit = (data: AssessmentFormData) => {
    mutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {assessment ? 'Edit Assessment' : 'Add Assessment'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Section ID</label>
            <Input
              type="number"
              {...register('section', { valueAsNumber: true })}
              error={errors.section?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input {...register('name')} error={errors.name?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Max Score</label>
            <Input
              type="number"
              {...register('max_score', { valueAsNumber: true })}
              error={errors.max_score?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Weight (%)</label>
            <Input
              type="number"
              {...register('weight', { valueAsNumber: true })}
              error={errors.weight?.message}
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
