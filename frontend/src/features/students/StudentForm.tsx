/**
 * Student Form Component
 */
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { studentsService, programsService, batchesService, academicsService } from '@/services'
import { Student } from '@/types'

const studentSchema = z.object({
  reg_no: z.string().min(1, 'Registration number is required'),
  name: z.string().min(1, 'Name is required'),
  program: z.string().min(1, 'Program is required'),
  batch: z.string().min(1, 'Batch is required'),
  group: z.string().optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'suspended', 'on_leave']),
})

type StudentFormData = z.infer<typeof studentSchema>

interface StudentFormProps {
  student?: Student | null
  onClose: () => void
  onSuccess: () => void
}

export function StudentForm({ student, onClose, onSuccess }: StudentFormProps) {
  // Fetch dropdown data
  const { data: programsData } = useQuery({
    queryKey: ['programs', { is_active: true }],
    queryFn: () => programsService.getAll({ is_active: true }),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: student ? {
      reg_no: student.reg_no,
      name: student.name,
      program: String(student.program),
      batch: String(student.batch),
      group: student.group ? String(student.group) : '',
      status: student.status,
    } : {
      reg_no: '',
      name: '',
      program: '',
      batch: '',
      group: '',
      status: 'active',
    },
  })

  const selectedProgram = watch('program')
  const selectedBatch = watch('batch')

  // Fetch batches for selected program
  const { data: batchesData } = useQuery({
    queryKey: ['batches', { program: selectedProgram ? parseInt(selectedProgram, 10) : undefined, is_active: true }],
    queryFn: () => batchesService.getAll({ program: selectedProgram ? parseInt(selectedProgram, 10) : undefined, is_active: true }),
    enabled: !!selectedProgram,
  })

  // Fetch groups for selected batch
  const { data: groupsData } = useQuery({
    queryKey: ['groups', { batch: selectedBatch ? parseInt(selectedBatch, 10) : undefined }],
    queryFn: () => academicsService.getGroups({ batch: selectedBatch ? parseInt(selectedBatch, 10) : undefined }),
    enabled: !!selectedBatch,
  })

  // Reset batch and group when program changes
  useEffect(() => {
    if (selectedProgram && (!student || String(student.program) !== selectedProgram)) {
      setValue('batch', '')
      setValue('group', '')
    }
  }, [selectedProgram, setValue, student])

  // Reset group when batch changes
  useEffect(() => {
    if (selectedBatch && (!student || String(student.batch) !== selectedBatch)) {
      setValue('group', '')
    }
  }, [selectedBatch, setValue, student])

  const mutation = useMutation({
    mutationFn: (data: StudentFormData) => {
      const programId = parseInt(data.program, 10)
      const batchId = parseInt(data.batch, 10)
      if (isNaN(programId) || isNaN(batchId)) {
        throw new Error('Invalid program or batch ID')
      }
      
      const studentData: Partial<Student> = {
        reg_no: data.reg_no,
        name: data.name,
        program: programId,
        batch: batchId,
        status: data.status,
      }
      
      if (data.group) {
        const groupId = parseInt(data.group, 10)
        if (!isNaN(groupId)) {
          studentData.group = groupId
        }
      }
      
      if (!student) {
        const createData: Omit<Student, 'id'> = {
          reg_no: data.reg_no,
          name: data.name,
          program: programId,
          batch: batchId,
          status: data.status,
          ...(data.group && { group: parseInt(data.group, 10) }),
        }
        return studentsService.create(createData)
      }
      return studentsService.update(student.id, studentData)
    },
    onSuccess: () => {
      toast.success(student ? 'Student updated successfully' : 'Student created successfully')
      onSuccess()
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to save student'
      toast.error(errorMessage)
    },
  })

  const onSubmit = (data: StudentFormData) => {
    mutation.mutate(data)
  }

  const programOptions = useMemo(() => {
    const programs = programsData?.results || programsData || []
    return programs.map((p) => ({
      value: String(p.id),
      label: p.name,
    }))
  }, [programsData])

  const batchOptions = useMemo(() => {
    const batches = batchesData?.results || batchesData || []
    return batches.map((b) => ({
      value: String(b.id),
      label: b.name,
    }))
  }, [batchesData])

  const groupOptions = useMemo(() => {
    const groups = groupsData || []
    return [
      { value: '', label: 'None (Optional)' },
      ...groups.map((g) => ({
        value: String(g.id),
        label: g.name,
      })),
    ]
  }, [groupsData])

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
            <Select
              label="Program"
              options={programOptions}
              value={watch('program') || ''}
              onChange={(value) => setValue('program', value)}
              error={errors.program?.message}
              required
              placeholder="Select program..."
            />
          </div>

          <div>
            <Select
              label="Batch"
              options={batchOptions}
              value={watch('batch') || ''}
              onChange={(value) => setValue('batch', value)}
              error={errors.batch?.message}
              required
              placeholder="Select batch..."
              disabled={!selectedProgram}
            />
          </div>

          <div>
            <Select
              label="Group (Optional)"
              options={groupOptions}
              value={watch('group') || ''}
              onChange={(value) => setValue('group', value)}
              error={errors.group?.message}
              placeholder="Select group..."
              disabled={!selectedBatch}
            />
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
              <option value="on_leave">On Leave</option>
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
