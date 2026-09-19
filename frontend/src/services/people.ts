/**
 * People API service (identity records with nested contact info, addresses, identity documents).
 *
 * Backend endpoints: /api/people/persons|contact-info|addresses|identity-documents
 * Tasks: people.persons.*, people.contact_info.*, people.addresses.*, people.identity_documents.*
 */
import api from '@/api/axios'
import { patchMultipart, postMultipart } from '@/lib/multipart'
import type { Paginated, PageParams } from '@/lib/pagination'

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say' | ''
export type ContactType = 'phone' | 'email' | 'emergency_contact' | 'whatsapp'
export type AddressType = 'mailing' | 'permanent' | 'temporary' | 'work'
export type IdentityDocumentType = 'cnic' | 'passport' | 'driving_license' | 'other'

export const GENDER_OPTIONS: Array<{ value: Exclude<Gender, ''>; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]
export const CONTACT_TYPE_OPTIONS: Array<{ value: ContactType; label: string }> = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'emergency_contact', label: 'Emergency contact' },
  { value: 'whatsapp', label: 'WhatsApp' },
]
export const ADDRESS_TYPE_OPTIONS: Array<{ value: AddressType; label: string }> = [
  { value: 'mailing', label: 'Mailing' },
  { value: 'permanent', label: 'Permanent' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'work', label: 'Work' },
]
export const DOCUMENT_TYPE_OPTIONS: Array<{ value: IdentityDocumentType; label: string }> = [
  { value: 'cnic', label: 'CNIC' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving license' },
  { value: 'other', label: 'Other' },
]

export interface ContactInfo {
  id: number
  person: number
  type: ContactType
  value: string
  label: string
  is_primary: boolean
  is_verified: boolean
}

export interface Address {
  id: number
  person: number
  type: AddressType
  street: string
  city: string
  state: string
  postal_code: string
  country: string
  is_primary: boolean
}

export interface IdentityDocument {
  id: number
  person: number
  type: IdentityDocumentType
  document_number: string
  issue_date: string | null
  expiry_date: string | null
  issuing_authority: string
  document_file: string | null
  is_verified: boolean
}

export interface PersonListItem {
  id: number
  first_name: string
  last_name: string
  full_name: string
  date_of_birth: string | null
  gender: Gender
  created_at: string
}

export interface Person extends PersonListItem {
  user: number | null
  middle_name: string
  national_id: string
  photo: string | null
  contact_info: ContactInfo[]
  addresses: Address[]
  identity_documents: IdentityDocument[]
  updated_at: string
}

export interface PersonPayload {
  first_name: string
  middle_name?: string
  last_name: string
  date_of_birth?: string | null
  gender?: Gender
  national_id?: string
}

export type ContactInfoPayload = Pick<ContactInfo, 'type' | 'value' | 'label' | 'is_primary'>
export type AddressPayload = Omit<Address, 'id' | 'person'>

export interface IdentityDocumentPayload {
  type: IdentityDocumentType
  document_number: string
  issue_date?: string | null
  expiry_date?: string | null
  issuing_authority?: string
  document_file?: File | null
}

const BASE = '/api/people'

export const peopleService = {
  async listPersons(params?: PageParams & { gender?: string }): Promise<Paginated<PersonListItem>> {
    const response = await api.get<Paginated<PersonListItem>>(`${BASE}/persons/`, { params })
    return response.data
  },

  async getPerson(id: number): Promise<Person> {
    const response = await api.get<Person>(`${BASE}/persons/${id}/`)
    return response.data
  },

  async createPerson(payload: PersonPayload): Promise<Person> {
    const response = await api.post<Person>(`${BASE}/persons/`, payload)
    return response.data
  },

  async updatePerson(id: number, payload: Partial<PersonPayload>): Promise<Person> {
    const response = await api.patch<Person>(`${BASE}/persons/${id}/`, payload)
    return response.data
  },

  async deletePerson(id: number): Promise<void> {
    await api.delete(`${BASE}/persons/${id}/`)
  },

  /** Upload or replace the profile photo (multipart). */
  async uploadPhoto(id: number, photo: File): Promise<Person> {
    return patchMultipart<Person>(`${BASE}/persons/${id}/`, { photo })
  },

  async removePhoto(id: number): Promise<Person> {
    const response = await api.patch<Person>(`${BASE}/persons/${id}/`, { photo: null })
    return response.data
  },

  async createContactInfo(person: number, payload: ContactInfoPayload): Promise<ContactInfo> {
    const response = await api.post<ContactInfo>(`${BASE}/contact-info/`, { ...payload, person })
    return response.data
  },

  async updateContactInfo(id: number, payload: Partial<ContactInfoPayload>): Promise<ContactInfo> {
    const response = await api.patch<ContactInfo>(`${BASE}/contact-info/${id}/`, payload)
    return response.data
  },

  async deleteContactInfo(id: number): Promise<void> {
    await api.delete(`${BASE}/contact-info/${id}/`)
  },

  async createAddress(person: number, payload: AddressPayload): Promise<Address> {
    const response = await api.post<Address>(`${BASE}/addresses/`, { ...payload, person })
    return response.data
  },

  async updateAddress(id: number, payload: Partial<AddressPayload>): Promise<Address> {
    const response = await api.patch<Address>(`${BASE}/addresses/${id}/`, payload)
    return response.data
  },

  async deleteAddress(id: number): Promise<void> {
    await api.delete(`${BASE}/addresses/${id}/`)
  },

  /** Identity documents carry a file, so they are always sent as multipart. */
  async createIdentityDocument(person: number, payload: IdentityDocumentPayload): Promise<IdentityDocument> {
    return postMultipart<IdentityDocument>(`${BASE}/identity-documents/`, { ...payload, person })
  },

  async updateIdentityDocument(id: number, payload: Partial<IdentityDocumentPayload>): Promise<IdentityDocument> {
    return patchMultipart<IdentityDocument>(`${BASE}/identity-documents/${id}/`, payload)
  },

  async deleteIdentityDocument(id: number): Promise<void> {
    await api.delete(`${BASE}/identity-documents/${id}/`)
  },
}
