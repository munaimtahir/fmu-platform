/**
 * Student Form Component
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { studentsService } from '@/services'
import { Student } from '@/types'

const studentSchema = z.object({
  reg_no: z.string().min(1, 'Registration number is required'),
  name: z.string().min(1, 'Name is required'),
  program: z.string().min(1, 'Program is required'),
  status: z.enum(['active', 'inactive', 'graduated', 'suspended']),
})

type StudentFormData = z.infer<typeof studentSchema>

interface StudentFormProps {
  student?: Student | null
  onClose: () => void
  onSuccess: () => void
}

export function StudentForm({ student, onClose, onSuccess }: StudentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: student ? {
      reg_no: student.reg_no,
      name: student.name,
      program: String(student.program),
      status: student.status,
    } : {
      reg_no: '',
      name: '',
      program: '',
      status: 'active',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: StudentFormData) => {
      const programId = parseInt(data.program, 10)
      if (isNaN(programId)) {
        throw new Error('Invalid program ID')
      }
      
      const studentData: Partial<Student> = {
        reg_no: data.reg_no,
        name: data.name,
        program: programId,
        status: data.status,
      }
      
      // For create, provide defaults if missing
      // TODO: Form needs to be updated to select batch and group
      // Backend requires: batch (FK), group (FK optional)
      if (!student) {
        const createData: Omit<Student, 'id'> = {
          reg_no: data.reg_no,
          name: data.name,
          program: programId,
          status: data.status,
          batch: 0, // TODO: Replace with actual batch selection
        }
        return studentsService.create(createData)
      }
      return studentsService.update(student.id, studentData)
    },
    onSuccess: () => {
      toast.success(student ? 'Student updated successfully' : 'Student created successfully')
      onSuccess()
    },
    onError: () => {
      toast.error('Failed to save student')
    },
  })

  const onSubmit = (data: StudentFormData) => {
    mutation.mutate(data)
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-form-title"
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 id="student-form-title" className="text-2xl font-bold mb-4">
          {student ? 'Edit Student' : 'Add Student'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="reg-no" className="block text-sm font-medium mb-1">
              Registration Number <span className="text-red-500" aria-label="required">*</span>
            </label>
            <Input 
              id="reg-no"
              {...register('reg_no')} 
              error={errors.reg_no?.message}
              aria-required="true"
              aria-invalid={!!errors.reg_no}
              aria-describedby={errors.reg_no ? 'reg-no-error' : undefined}
            />
            {errors.reg_no && (
              <p id="reg-no-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.reg_no.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name <span className="text-red-500" aria-label="required">*</span>
            </label>
            <Input 
              id="name"
              {...register('name')} 
              error={errors.name?.message}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="program" className="block text-sm font-medium mb-1">
              Program <span className="text-red-500" aria-label="required">*</span>
            </label>
            <Input 
              id="program"
              type="number"
              {...register('program')} 
              error={errors.program?.message}
              aria-required="true"
              aria-invalid={!!errors.program}
              aria-describedby={errors.program ? 'program-error' : undefined}
            />
            {errors.program && (
              <p id="program-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.program.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">
              Status <span className="text-red-500" aria-label="required">*</span>
            </label>
            <select
              id="status"
              {...register('status')}
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-required="true"
              aria-invalid={!!errors.status}
              aria-describedby={errors.status ? 'status-error' : undefined}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="suspended">Suspended</option>
            </select>
            {errors.status && (
              <p id="status-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.status.message}
              </p>
            )}
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
              aria-label={student ? 'Save student changes' : 'Create new student'}
            >
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
