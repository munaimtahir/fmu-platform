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

// CNIC format validation: 12345-123456-1
const cnicRegex = /^\d{5}-\d{7}-\d{1}$/

// Form validation schema
const applicationSchema = z.object({
  // Personal Information
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  father_name: z.string().min(2, 'Father name is required'),
  gender: z.enum(['M', 'F', 'O']),
  date_of_birth: z.date(),
  cnic: z.string().regex(cnicRegex, 'CNIC must be in format 12345-123456-1'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      'Phone number must be in E.164 format (e.g., +923001234567)'
    )
    .min(8, 'Phone number is too short')
    .max(16, 'Phone number is too long'),
  // Address
  address_city: z.string().min(1, 'City is required'),
  address_district: z.string().min(1, 'District is required'),
  address_state: z.string().min(1, 'State/Province is required'),
  address_country: z.string().min(1, 'Country is required'),
  // Mailing Address
  mailing_address_same: z.boolean().default(true),
  mailing_address: z.string().optional(),
  mailing_city: z.string().optional(),
  mailing_district: z.string().optional(),
  mailing_state: z.string().optional(),
  mailing_country: z.string().optional(),
  // Guardian Information
  guardian_name: z.string().min(2, 'Guardian name is required'),
  guardian_relation: z.enum(['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER']),
  guardian_phone: z
    .string()
    .min(10, 'Guardian phone number is required')
    .max(20, 'Phone number is too long'),
  guardian_email: z.string().email('Please enter a valid guardian email address'),
  guardian_mailing_address: z.string().min(5, 'Guardian mailing address is required'),
  // Admission/Merit Details
  mdcat_roll_number: z.string().min(1, 'MDCAT roll number is required'),
  merit_number: z.number().int().positive('Merit number must be a positive integer'),
  merit_percentage: z
    .number()
    .min(0.0000, 'Merit percentage must be at least 0')
    .max(100.0000, 'Merit percentage cannot exceed 100')
    .refine((val) => {
      const decimalStr = val.toString()
      if (decimalStr.includes('.')) {
        return decimalStr.split('.')[1].length <= 4
      }
      return true
    }, 'Merit percentage can have up to 4 decimal places'),
  // Qualifications - HSSC
  hssc_year: z.number().int().min(1900).max(2100),
  hssc_board: z.string().min(1, 'HSSC board is required'),
  hssc_marks: z.number().int().min(0, 'HSSC marks must be non-negative'),
  hssc_percentage: z
    .number()
    .min(0, 'HSSC percentage must be at least 0')
    .max(100, 'HSSC percentage cannot exceed 100'),
  // Qualifications - SSC
  ssc_year: z.number().int().min(1900).max(2100),
  ssc_board: z.string().min(1, 'SSC board is required'),
  ssc_marks: z.number().int().min(0, 'SSC marks must be non-negative'),
  ssc_percentage: z
    .number()
    .min(0, 'SSC percentage must be at least 0')
    .max(100, 'SSC percentage cannot exceed 100'),
  // Academic Information
  program: z.string().optional(),
  batch_year: z.number().min(2024).max(2040),
  // Documents
  father_id_card: z.instanceof(FileList).refine((files) => files.length > 0, 'Father ID card is required'),
  guardian_id_card: z.instanceof(FileList).optional(),
  domicile: z.instanceof(FileList).refine((files) => files.length > 0, 'Domicile certificate is required'),
  ssc_certificate: z.instanceof(FileList).refine((files) => files.length > 0, 'SSC certificate is required'),
  hssc_certificate: z.instanceof(FileList).refine((files) => files.length > 0, 'HSSC certificate is required'),
  mdcat_result: z.instanceof(FileList).refine((files) => files.length > 0, 'MDCAT result is required'),
}).refine(
  (data) => {
    // Guardian ID card is required if guardian is not father
    if (data.guardian_relation !== 'FATHER') {
      return data.guardian_id_card && data.guardian_id_card.length > 0
    }
    return true
  },
  {
    message: 'Guardian ID card is required when guardian is not father',
    path: ['guardian_id_card'],
  }
).refine(
  (data) => {
    // If mailing address is not same, mailing address fields are required
    if (!data.mailing_address_same) {
      return (
        data.mailing_city &&
        data.mailing_district &&
        data.mailing_state &&
        data.mailing_country
      )
    }
    return true
  },
  {
    message: 'Mailing address fields are required when mailing address is different',
    path: ['mailing_city'],
  }
)

type ApplicationFormData = z.infer<typeof applicationSchema>

// CNIC input mask helper
const formatCNIC = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')
  
  // Apply format: 12345-123456-1
  if (digits.length <= 5) {
    return digits
  } else if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  } else {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`
  }
}

export const StudentApplicationPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)
  const [showLoadDraftModal, setShowLoadDraftModal] = useState(false)
  const [loadDraftEmail, setLoadDraftEmail] = useState('')
  const [draftMessage, setDraftMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema) as any,
    mode: 'onChange',
    defaultValues: {
      mailing_address_same: true,
      address_country: 'Pakistan',
      mailing_country: 'Pakistan',
      batch_year: new Date().getFullYear() + 5, // Default to 5 years from now for MBBS
    },
  })

  const dateOfBirth = watch('date_of_birth')
  const mailingAddressSame = watch('mailing_address_same')
  const guardianRelation = watch('guardian_relation')
  const addressCity = watch('address_city')
  const addressDistrict = watch('address_district')
  const addressState = watch('address_state')
  const addressCountry = watch('address_country')
  // Program selection is fixed to the single active program (MBBS), so we skip
  // loading selectable programs and use the default batch year instead.

  // Copy address to mailing address when "same" is checked
  useEffect(() => {
    if (mailingAddressSame && addressCity && addressDistrict && addressState && addressCountry) {
      setValue('mailing_city', addressCity)
      setValue('mailing_district', addressDistrict)
      setValue('mailing_state', addressState)
      setValue('mailing_country', addressCountry)
      setValue('mailing_address', '')
    }
  }, [mailingAddressSame, addressCity, addressDistrict, addressState, addressCountry, setValue])

  const onSaveDraft = async () => {
    try {
      const formData = watch()
      const email = formData.email?.trim().toLowerCase() || ''
      
      if (!email) {
        setDraftMessage('Please enter your email address to save a draft')
        return
      }
      
      setIsSavingDraft(true)
      setDraftMessage(null)
      setSubmitError(null)
      
      // Prepare data for draft save
      const draftData: any = {
        ...formData,
        email,
      }
      
      // Convert date to string if present
      if (draftData.date_of_birth instanceof Date) {
        draftData.date_of_birth = draftData.date_of_birth.toISOString().split('T')[0]
      }
      
      // Convert program to string if present
      if (draftData.program) {
        draftData.program = draftData.program.toString()
      }
      
      await studentApplicationsService.saveDraft(draftData)
      setDraftMessage('Draft saved successfully')
      setTimeout(() => setDraftMessage(null), 3000)
    } catch (error: any) {
      console.error('Error saving draft:', error)
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        'Failed to save draft. Please try again.'
      setDraftMessage(errorMessage)
    } finally {
      setIsSavingDraft(false)
    }
  }

  const onLoadDraft = async () => {
    if (!loadDraftEmail.trim()) {
      setDraftMessage('Please enter your email address')
      return
    }
    
    try {
      setIsLoadingDraft(true)
      setDraftMessage(null)
      setSubmitError(null)
      
      const response = await studentApplicationsService.loadDraft(loadDraftEmail.trim())
      const draft = response.draft
      
      // Populate form with draft data
      if (draft.form_data) {
        const formData = draft.form_data
        
        // Set all text/number fields
        Object.keys(formData).forEach((key) => {
          const value = formData[key]
          if (value !== null && value !== undefined && value !== '') {
            // Handle date fields
            if (key === 'date_of_birth' && typeof value === 'string') {
              setValue(key as any, new Date(value))
            } else {
              setValue(key as any, value)
            }
          }
        })
      }
      
      // Handle file URLs - show existing files
      if (response.file_urls) {
        // Note: We can't directly set FileList, but we can show the user that files are already uploaded
        // In a real implementation, you might want to fetch and display these files
        console.log('Existing files:', response.file_urls)
      }
      
      setDraftMessage('Draft loaded successfully')
      setShowLoadDraftModal(false)
      setLoadDraftEmail('')
      setTimeout(() => setDraftMessage(null), 3000)
    } catch (error: any) {
      console.error('Error loading draft:', error)
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        'Failed to load draft. Please try again.'
      setDraftMessage(errorMessage)
    } finally {
      setIsLoadingDraft(false)
    }
  }

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      setDraftMessage(null)

      // Check if there's a draft for this email - if so, submit the draft
      // Otherwise, create a new application directly
      const email = data.email.trim().toLowerCase()
      
      try {
        // Try to submit draft first
        await studentApplicationsService.submitDraft(email)
        setSubmitSuccess(true)
        return
      } catch (draftError: any) {
        // If draft doesn't exist or is already submitted, create new application
        if (draftError.response?.status === 404 || draftError.response?.status === 400) {
          // No draft found or already submitted, proceed with regular submission
        } else {
          // Some other error, try regular submission anyway
        }
      }

      // Regular submission (no draft or draft submission failed)
      const applicationData = {
        first_name: data.first_name,
        last_name: data.last_name,
        father_name: data.father_name,
        gender: data.gender,
        date_of_birth: data.date_of_birth.toISOString().split('T')[0],
        cnic: data.cnic,
        email: data.email,
        phone: data.phone,
        address_city: data.address_city,
        address_district: data.address_district,
        address_state: data.address_state,
        address_country: data.address_country,
        mailing_address_same: data.mailing_address_same,
        mailing_address: data.mailing_address || '',
        mailing_city: data.mailing_city || '',
        mailing_district: data.mailing_district || '',
        mailing_state: data.mailing_state || '',
        mailing_country: data.mailing_country || '',
        guardian_name: data.guardian_name,
        guardian_relation: data.guardian_relation,
        guardian_phone: data.guardian_phone,
        guardian_email: data.guardian_email,
        guardian_mailing_address: data.guardian_mailing_address,
        mdcat_roll_number: data.mdcat_roll_number,
        merit_number: data.merit_number,
        merit_percentage: data.merit_percentage,
        hssc_year: data.hssc_year,
        hssc_board: data.hssc_board,
        hssc_marks: data.hssc_marks,
        hssc_percentage: data.hssc_percentage,
        ssc_year: data.ssc_year,
        ssc_board: data.ssc_board,
        ssc_marks: data.ssc_marks,
        ssc_percentage: data.ssc_percentage,
        program: data.program ? parseInt(data.program) : undefined,
        batch_year: data.batch_year,
        father_id_card: data.father_id_card[0],
        guardian_id_card: data.guardian_id_card && data.guardian_id_card.length > 0 ? data.guardian_id_card[0] : undefined,
        domicile: data.domicile[0],
        ssc_certificate: data.ssc_certificate[0],
        hssc_certificate: data.hssc_certificate[0],
        mdcat_result: data.mdcat_result[0],
      }

      await studentApplicationsService.submit(applicationData)
      setSubmitSuccess(true)
    } catch (error: any) {
      console.error('Error submitting application:', error)
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Failed to submit application. Please try again.'
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const genderOptions: SelectOption[] = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'O', label: 'Other' },
  ]

  const guardianRelationOptions: SelectOption[] = [
    { value: 'FATHER', label: 'Father' },
    { value: 'MOTHER', label: 'Mother' },
    { value: 'GUARDIAN', label: 'Guardian' },
    { value: 'OTHER', label: 'Other' },
  ]

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
            Registration Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Your registration has been received and is pending review. You will be
            notified via email once your registration has been processed.
          </p>
          <Button
            onClick={() => {
              setSubmitSuccess(false)
              window.location.reload()
            }}
            variant="primary"
          >
            Submit Another Registration
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Student Registration Form
          </h1>
          <p className="text-lg text-gray-600">
            Complete your registration for FMU - MBBS Program
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
            {/* Personal Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  {...register('first_name')}
                  error={errors.first_name?.message}
                  required
                  placeholder="Enter your first name"
                />
                <Input
                  label="Last Name"
                  {...register('last_name')}
                  error={errors.last_name?.message}
                  required
                  placeholder="Enter your last name"
                />
                <Input
                  label="Father Name"
                  {...register('father_name')}
                  error={errors.father_name?.message}
                  required
                  placeholder="Enter your father's name"
                />
                <Select
                  label="Gender"
                  options={genderOptions}
                  value={watch('gender') || ''}
                  onChange={(value) => setValue('gender', value as 'M' | 'F' | 'O')}
                  error={errors.gender?.message}
                  required
                />
                <DatePicker
                  label="Date of Birth"
                  value={dateOfBirth ? new Date(dateOfBirth) : null}
                  onChange={(date) => {
                    if (date) {
                      setValue('date_of_birth', date.toISOString().split('T')[0], { shouldValidate: true })
                    }
                  }}
                  error={errors.date_of_birth?.message}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
                <Input
                  label="CNIC Number"
                  {...register('cnic', {
                    onChange: (e) => {
                      const formatted = formatCNIC(e.target.value)
                      setValue('cnic', formatted, { shouldValidate: true })
                    },
                  })}
                  error={errors.cnic?.message}
                  required
                  placeholder="12345-123456-1"
                  maxLength={15}
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
              </div>
            </div>

            {/* Address Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Permanent Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="City"
                  {...register('address_city')}
                  error={errors.address_city?.message}
                  required
                  placeholder="Enter city"
                />
                <Input
                  label="District"
                  {...register('address_district')}
                  error={errors.address_district?.message}
                  required
                  placeholder="Enter district"
                />
                <Input
                  label="State/Province"
                  {...register('address_state')}
                  error={errors.address_state?.message}
                  required
                  placeholder="Enter state/province"
                />
                <Input
                  label="Country"
                  {...register('address_country')}
                  error={errors.address_country?.message}
                  required
                  placeholder="Enter country"
                />
              </div>
            </div>

            {/* Mailing Address Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Mailing Address
              </h2>
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={mailingAddressSame}
                    onChange={(e) => setValue('mailing_address_same', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Same as permanent address</span>
                </label>
              </div>
              {!mailingAddressSame && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextArea
                    label="Mailing Address"
                    {...register('mailing_address')}
                    error={errors.mailing_address?.message}
                    placeholder="Enter mailing address"
                    rows={2}
                  />
                  <Input
                    label="Mailing City"
                    {...register('mailing_city')}
                    error={errors.mailing_city?.message}
                    placeholder="Enter mailing city"
                  />
                  <Input
                    label="Mailing District"
                    {...register('mailing_district')}
                    error={errors.mailing_district?.message}
                    placeholder="Enter mailing district"
                  />
                  <Input
                    label="Mailing State/Province"
                    {...register('mailing_state')}
                    error={errors.mailing_state?.message}
                    placeholder="Enter mailing state/province"
                  />
                  <Input
                    label="Mailing Country"
                    {...register('mailing_country')}
                    error={errors.mailing_country?.message}
                    placeholder="Enter mailing country"
                  />
                </div>
              )}
            </div>

            {/* Guardian Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Guardian Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Guardian Name"
                  {...register('guardian_name')}
                  error={errors.guardian_name?.message}
                  required
                  placeholder="Enter guardian name"
                />
                <Select
                  label="Relation"
                  options={guardianRelationOptions}
                  value={guardianRelation || ''}
                  onChange={(value) => setValue('guardian_relation', value as any)}
                  error={errors.guardian_relation?.message}
                  required
                />
                <Input
                  label="Guardian Phone Number"
                  type="tel"
                  {...register('guardian_phone')}
                  error={errors.guardian_phone?.message}
                  required
                  placeholder="+923001234567"
                />
                <Input
                  label="Guardian Email Address"
                  type="email"
                  {...register('guardian_email')}
                  error={errors.guardian_email?.message}
                  required
                  placeholder="guardian.email@example.com"
                />
                <div className="md:col-span-2">
                  <TextArea
                    label="Guardian Mailing Address"
                    {...register('guardian_mailing_address')}
                    error={errors.guardian_mailing_address?.message}
                    required
                    placeholder="Enter guardian mailing address"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Admission/Merit Details Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Admission/Merit Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="MDCAT Roll Number"
                  {...register('mdcat_roll_number')}
                  error={errors.mdcat_roll_number?.message}
                  required
                  placeholder="Enter MDCAT roll number"
                />
                <Input
                  label="Merit Number"
                  type="number"
                  {...register('merit_number', { valueAsNumber: true })}
                  error={errors.merit_number?.message}
                  required
                  placeholder="Enter merit number"
                />
                <Input
                  label="Merit Percentage"
                  type="number"
                  step="0.0001"
                  {...register('merit_percentage', { valueAsNumber: true })}
                  error={errors.merit_percentage?.message}
                  required
                  placeholder="0.0000"
                  helperText="Up to 4 decimal places (e.g., 85.1234)"
                />
              </div>
            </div>

            {/* Qualifications Section - HSSC */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Qualification - HSSC/Intermediate
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Year"
                  type="number"
                  {...register('hssc_year', { valueAsNumber: true })}
                  error={errors.hssc_year?.message}
                  required
                  placeholder="e.g., 2023"
                />
                <Input
                  label="Board"
                  {...register('hssc_board')}
                  error={errors.hssc_board?.message}
                  required
                  placeholder="Enter board name"
                />
                <Input
                  label="Total Marks"
                  type="number"
                  {...register('hssc_marks', { valueAsNumber: true })}
                  error={errors.hssc_marks?.message}
                  required
                  placeholder="Enter total marks"
                />
                <Input
                  label="Percentage"
                  type="number"
                  step="0.01"
                  {...register('hssc_percentage', { valueAsNumber: true })}
                  error={errors.hssc_percentage?.message}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Qualifications Section - SSC */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Qualification - SSC/Matric
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Year"
                  type="number"
                  {...register('ssc_year', { valueAsNumber: true })}
                  error={errors.ssc_year?.message}
                  required
                  placeholder="e.g., 2021"
                />
                <Input
                  label="Board"
                  {...register('ssc_board')}
                  error={errors.ssc_board?.message}
                  required
                  placeholder="Enter board name"
                />
                <Input
                  label="Total Marks"
                  type="number"
                  {...register('ssc_marks', { valueAsNumber: true })}
                  error={errors.ssc_marks?.message}
                  required
                  placeholder="Enter total marks"
                />
                <Input
                  label="Percentage"
                  type="number"
                  step="0.01"
                  {...register('ssc_percentage', { valueAsNumber: true })}
                  error={errors.ssc_percentage?.message}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Required Documents
              </h2>
              <div className="space-y-4">
                <FileUpload
                  label="Father ID Card"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={3 * 1024 * 1024} // 3MB
                  onChange={(files) => {
                    if (files) {
                      setValue('father_id_card', files, { shouldValidate: true })
                    }
                  }}
                  error={errors.father_id_card?.message as string}
                  required
                  helperText="PDF, JPG, or PNG (max 3MB)"
                />
                {guardianRelation !== 'FATHER' && (
                  <FileUpload
                    label="Guardian ID Card"
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={3 * 1024 * 1024} // 3MB
                    onChange={(files) => {
                      setValue('guardian_id_card', files || undefined, { shouldValidate: true })
                    }}
                    error={errors.guardian_id_card?.message as string}
                    required
                    helperText="PDF, JPG, or PNG (max 3MB) - Required when guardian is not father"
                  />
                )}
                <FileUpload
                  label="Domicile Certificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={3 * 1024 * 1024} // 3MB
                  onChange={(files) => {
                    if (files) {
                      setValue('domicile', files, { shouldValidate: true })
                    }
                  }}
                  error={errors.domicile?.message as string}
                  required
                  helperText="PDF, JPG, or PNG (max 3MB)"
                />
                <FileUpload
                  label="SSC/Matric Certificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={3 * 1024 * 1024} // 3MB
                  onChange={(files) => {
                    if (files) {
                      setValue('ssc_certificate', files, { shouldValidate: true })
                    }
                  }}
                  error={errors.ssc_certificate?.message as string}
                  required
                  helperText="PDF, JPG, or PNG (max 3MB)"
                />
                <FileUpload
                  label="HSSC/FSC Certificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={3 * 1024 * 1024} // 3MB
                  onChange={(files) => {
                    if (files) {
                      setValue('hssc_certificate', files, { shouldValidate: true })
                    }
                  }}
                  error={errors.hssc_certificate?.message as string}
                  required
                  helperText="PDF, JPG, or PNG (max 3MB)"
                />
                <FileUpload
                  label="MDCAT Result/Screenshot"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={3 * 1024 * 1024} // 3MB
                  onChange={(files) => {
                    if (files) {
                      setValue('mdcat_result', files, { shouldValidate: true })
                    }
                  }}
                  error={errors.mdcat_result?.message as string}
                  required
                  helperText="PDF, JPG, or PNG (max 3MB)"
                />
              </div>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            {/* Draft Message */}
            {draftMessage && (
              <div className={`border rounded-2xl p-4 ${
                draftMessage.includes('successfully') || draftMessage.includes('loaded')
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <p className={`text-sm ${
                  draftMessage.includes('successfully') || draftMessage.includes('loaded')
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}>{draftMessage}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 gap-4">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onSaveDraft}
                  isLoading={isSavingDraft}
                  disabled={isSavingDraft || isLoadingDraft || isLoadingPrograms}
                >
                  {isSavingDraft ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowLoadDraftModal(true)}
                  disabled={isSavingDraft || isLoadingDraft || isLoadingPrograms}
                >
                  Load Draft
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowLoadDraftModal(true)}
                disabled={isSavingDraft || isLoadingDraft}
              >
                Load Draft
              </Button>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={isSubmitting || isSavingDraft || isLoadingDraft}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Final'}
            </Button>
          </form>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Your registration will be reviewed by the admissions office. You will
            receive an email notification once your registration has been processed.
          </p>
        </div>
      </div>

      {/* Load Draft Modal */}
      {showLoadDraftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Load Saved Draft</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your email address to load your saved application draft.
            </p>
            <Input
              label="Email Address"
              type="email"
              value={loadDraftEmail}
              onChange={(e) => setLoadDraftEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="mb-4"
            />
            {draftMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                draftMessage.includes('successfully') || draftMessage.includes('loaded')
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}>
                <p className="text-sm">{draftMessage}</p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowLoadDraftModal(false)
                  setLoadDraftEmail('')
                  setDraftMessage(null)
                }}
                disabled={isLoadingDraft}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={onLoadDraft}
                isLoading={isLoadingDraft}
                disabled={isLoadingDraft || !loadDraftEmail.trim()}
              >
                {isLoadingDraft ? 'Loading...' : 'Load Draft'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
