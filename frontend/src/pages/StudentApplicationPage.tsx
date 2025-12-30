import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Select, SelectOption } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { FileUpload } from '@/components/ui/FileUpload'
import { studentApplicationsService } from '@/services/studentApplications'
import { programsService } from '@/services/programs'
import { Program } from '@/types'

// Form validation schema
const applicationSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  date_of_birth: z.date({
    message: 'Date of birth is required',
  }),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      'Phone number must be in E.164 format (e.g., +923001234567)'
    )
    .min(8, 'Phone number is too short')
    .max(16, 'Phone number is too long'),
  address: z.string().optional(),
  program: z.string().min(1, 'Please select a program'),
  batch_year: z.number().min(2024).max(2040),
  previous_qualification: z.string().optional(),
  previous_institution: z.string().optional(),
  documents: z.instanceof(FileList).optional(),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

export const StudentApplicationPage = () => {
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      batch_year: new Date().getFullYear() + 5, // Default to 5 years from now for MBBS
    },
  })

  const selectedProgramId = watch('program')
  const dateOfBirth = watch('date_of_birth')

  // Fetch MBBS programs (Undergraduate Medical)
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setIsLoadingPrograms(true)
        const response = await programsService.getAll({
          level: 'undergraduate',
          category: 'ug_medical',
          is_active: true,
        })
        setPrograms(response.results)
        
        // Auto-select MBBS if available
        const mbbsProgram = response.results.find((p) => 
          p.name.toLowerCase().includes('mbbs')
        )
        if (mbbsProgram) {
          setValue('program', mbbsProgram.id.toString())
          setSelectedProgram(mbbsProgram)
          // Calculate batch year: current year + duration
          const currentYear = new Date().getFullYear()
          const batchYear = currentYear + mbbsProgram.duration_years
          setValue('batch_year', batchYear)
        }
      } catch (error) {
        console.error('Error fetching programs:', error)
        setSubmitError('Failed to load programs. Please refresh the page.')
      } finally {
        setIsLoadingPrograms(false)
      }
    }

    fetchPrograms()
  }, [setValue])

  // Update selected program when program ID changes
  useEffect(() => {
    if (selectedProgramId) {
      const program = programs.find((p) => p.id.toString() === selectedProgramId)
      if (program) {
        setSelectedProgram(program)
        // Recalculate batch year when program changes
        if (dateOfBirth) {
          const currentYear = new Date().getFullYear()
          const batchYear = currentYear + program.duration_years
          setValue('batch_year', batchYear)
        }
      }
    }
  }, [selectedProgramId, programs, dateOfBirth, setValue])

  // Calculate batch year when date of birth changes
  useEffect(() => {
    if (dateOfBirth && selectedProgram) {
      const currentYear = new Date().getFullYear()
      const batchYear = currentYear + selectedProgram.duration_years
      setValue('batch_year', batchYear)
    }
  }, [dateOfBirth, selectedProgram, setValue])

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const applicationData = {
        full_name: data.full_name,
        date_of_birth: data.date_of_birth.toISOString().split('T')[0],
        email: data.email,
        phone: data.phone,
        address: data.address || '',
        program: parseInt(data.program),
        batch_year: data.batch_year,
        previous_qualification: data.previous_qualification || '',
        previous_institution: data.previous_institution || '',
        documents: data.documents && data.documents.length > 0 ? data.documents[0] : undefined,
      }

      await studentApplicationsService.submit(applicationData)
      setSubmitSuccess(true)
    } catch (error: any) {
      console.error('Error submitting application:', error)
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Failed to submit application. Please try again.'
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const programOptions: SelectOption[] = programs.map((program) => ({
    value: program.id.toString(),
    label: `${program.name} (${program.duration_years} years) - Batch ${new Date().getFullYear() + program.duration_years}`,
  }))

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Application Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Your application has been received and is pending review. You will be
            notified via email once your application has been reviewed.
          </p>
          <Button
            onClick={() => {
              setSubmitSuccess(false)
              window.location.reload()
            }}
            variant="primary"
          >
            Submit Another Application
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Student Application Form
          </h1>
          <p className="text-lg text-gray-600">
            Apply for admission to FMU - MBBS Program
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Full Name"
                    {...register('full_name')}
                    error={errors.full_name?.message}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <DatePicker
                  label="Date of Birth"
                  value={dateOfBirth || null}
                  onChange={(date) => {
                    if (date) {
                      setValue('date_of_birth', date, { shouldValidate: true })
                    }
                  }}
                  error={errors.date_of_birth?.message}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />

                <Input
                  label="Email Address"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  required
                  placeholder="your.email@example.com"
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  {...register('phone')}
                  error={errors.phone?.message}
                  required
                  placeholder="+923001234567"
                  helperText="Enter phone number in international E.164 format (e.g., +923001234567)"
                />

                <div className="md:col-span-2">
                  <TextArea
                    label="Address"
                    {...register('address')}
                    error={errors.address?.message}
                    placeholder="Enter your complete address"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Academic Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Academic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Select
                    label="Program"
                    options={programOptions}
                    value={selectedProgramId || ''}
                    onChange={(value) => setValue('program', value)}
                    error={errors.program?.message}
                    required
                    disabled={isLoadingPrograms}
                    placeholder={
                      isLoadingPrograms
                        ? 'Loading programs...'
                        : 'Select a program'
                    }
                  />
                  {selectedProgram && (
                    <p className="mt-2 text-sm text-gray-600">
                      Program Duration: {selectedProgram.duration_years} years
                    </p>
                  )}
                </div>

                <Input
                  label="Expected Graduating Year (Batch Year)"
                  type="number"
                  {...register('batch_year', { valueAsNumber: true })}
                  error={errors.batch_year?.message}
                  required
                  disabled
                  helperText="Automatically calculated based on program duration"
                />

                <Input
                  label="Previous Qualification"
                  {...register('previous_qualification')}
                  error={errors.previous_qualification?.message}
                  placeholder="e.g., F.Sc. Pre-Medical"
                />

                <Input
                  label="Previous Institution"
                  {...register('previous_institution')}
                  error={errors.previous_institution?.message}
                  placeholder="Name of your previous school/college"
                />
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Supporting Documents
              </h2>
              <FileUpload
                label="Upload Documents"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                maxSize={10 * 1024 * 1024} // 10MB
                onChange={(files) => {
                  setValue('documents', files || undefined, { shouldValidate: true })
                }}
                error={errors.documents?.message as string}
                helperText="Upload certificates, transcripts, or other supporting documents (PDF, DOC, or images up to 10MB)"
              />
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting || isLoadingPrograms}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Your application will be reviewed by the admissions office. You will
            receive an email notification once your application has been processed.
          </p>
        </div>
      </div>
    </div>
  )
}

