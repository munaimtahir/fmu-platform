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
import { FormSection } from '@/components/ui/FormSection'
import { studentsService, programsService, batchesService, academicsService } from '@/services'
import { groupsKey } from '@/utils/queryKeys'
import { Student, Program } from '@/types'
import { Batch } from '@/services/batches'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'

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
    formState: { errors, isDirty },
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
    queryKey: groupsKey({ batch: selectedBatch ? parseInt(selectedBatch, 10) : undefined }),
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

  useUnsavedChangesWarning(isDirty)

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
    if (!programsData) return []
    const programs = 'results' in programsData ? programsData.results : Array.isArray(programsData) ? programsData : []
    return programs.map((p: Program) => ({
      value: String(p.id),
      label: p.name,
    }))
  }, [programsData])

  const batchOptions = useMemo(() => {
    if (!batchesData) return []
    const batches = 'results' in batchesData ? batchesData.results : Array.isArray(batchesData) ? batchesData : []
    return batches.map((b: Batch) => ({
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-form-title"
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 id="student-form-title" className="text-h2 mb-4">
          {student ? 'Edit Student' : 'Add Student'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormSection title="Student Details">
            <div>
              <Input
                id="reg-no"
                label="Registration Number"
                required
                {...register('reg_no')}
                error={errors.reg_no?.message}
                aria-required="true"
                aria-invalid={!!errors.reg_no}
              />
            </div>

            <div>
              <Input
                id="name"
                label="Name"
                required
                {...register('name')}
                error={errors.name?.message}
                aria-required="true"
                aria-invalid={!!errors.name}
              />
            </div>

            <div>
              <Select
                label="Program"
                options={programOptions}
                value={watch('program') || ''}
                onChange={(value) => setValue('program', value, { shouldDirty: true })}
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
                onChange={(value) => setValue('batch', value, { shouldDirty: true })}
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
                onChange={(value) => setValue('group', value, { shouldDirty: true })}
                error={errors.group?.message}
                placeholder="Select group..."
                disabled={!selectedBatch}
              />
            </div>

            <div>
              <Select
                label="Status"
                required
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'graduated', label: 'Graduated' },
                  { value: 'suspended', label: 'Suspended' },
                  { value: 'on_leave', label: 'On Leave' },
                ]}
                value={watch('status') || 'active'}
                onChange={(value) => setValue('status', value as StudentFormData['status'], { shouldDirty: true })}
                error={errors.status?.message}
              />
            </div>
          </FormSection>

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
