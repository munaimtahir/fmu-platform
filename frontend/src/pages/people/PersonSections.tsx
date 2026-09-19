import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileUpload } from '@/components/ui/FileUpload'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LabeledSelect } from '@/components/shared/LabeledSelect'
import { useDownload } from '@/lib/download'
import { parseApiError } from '@/lib/apiErrors'
import { fileNameFromUrl, sameOriginPath } from '@/lib/mediaUrl'
import {
  ADDRESS_TYPE_OPTIONS,
  CONTACT_TYPE_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
  peopleService,
  type Address,
  type AddressType,
  type ContactInfo,
  type ContactType,
  type IdentityDocument,
  type IdentityDocumentType,
} from '@/services/people'

const labelOf = (options: Array<{ value: string; label: string }>, value: string) =>
  options.find((option) => option.value === value)?.label ?? value

function useRefreshPerson(personId: number) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['person', personId] })
}

interface SectionShellProps {
  title: string
  addLabel: string
  addTask: string
  onAdd: () => void
  children: React.ReactNode
}

const SectionShell: React.FC<SectionShellProps> = ({ title, addLabel, addTask, onAdd, children }) => (
  <Card>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-h4 text-ink-primary">{title}</h2>
      <Can tasks={[addTask]}>
        <Button size="sm" variant="secondary" onClick={onAdd}>
          {addLabel}
        </Button>
      </Can>
    </div>
    {children}
  </Card>
)

interface RowActionsProps {
  updateTask: string
  deleteTask: string
  onEdit: () => void
  onDelete: () => void
  label: string
}

const RowActions: React.FC<RowActionsProps> = ({ updateTask, deleteTask, onEdit, onDelete, label }) => (
  <div className="flex gap-2">
    <Can tasks={[updateTask]}>
      <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Edit ${label}`}>
        Edit
      </Button>
    </Can>
    <Can tasks={[deleteTask]}>
      <Button size="sm" variant="danger" onClick={onDelete} aria-label={`Delete ${label}`}>
        Delete
      </Button>
    </Can>
  </div>
)

/** Shared server-error handling for the nested add/edit modals. */
function useServerErrors() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  return {
    fieldErrors,
    formError,
    clear: () => {
      setFieldErrors({})
      setFormError(null)
    },
    fail: (error: unknown) => {
      const info = parseApiError(error)
      setFieldErrors(info.fieldErrors)
      setFormError(Object.keys(info.fieldErrors).length ? null : info.message)
    },
    setFieldErrors,
  }
}

// ---------------------------------------------------------------- Contact info

const ContactForm: React.FC<{ personId: number; contact?: ContactInfo; onClose: () => void }> = ({
  personId,
  contact,
  onClose,
}) => {
  const refresh = useRefreshPerson(personId)
  const errors = useServerErrors()
  const [type, setType] = useState<ContactType>(contact?.type ?? 'phone')
  const [value, setValue] = useState(contact?.value ?? '')
  const [label, setLabel] = useState(contact?.label ?? '')
  const [isPrimary, setIsPrimary] = useState(contact?.is_primary ?? false)

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { type, value: value.trim(), label: label.trim(), is_primary: isPrimary }
      return contact
        ? peopleService.updateContactInfo(contact.id, payload)
        : peopleService.createContactInfo(personId, payload)
    },
    onSuccess: () => {
      toast.success(contact ? 'Contact updated' : 'Contact added')
      refresh()
      onClose()
    },
    onError: errors.fail,
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    errors.clear()
    if (!value.trim()) {
      errors.setFieldErrors({ value: 'A value is required' })
      return
    }
    mutation.mutate()
  }

  return (
    <Modal title={contact ? 'Edit contact' : 'Add contact'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {errors.formError && <Alert variant="error">{errors.formError}</Alert>}
        <LabeledSelect
          id="contact-type"
          label="Type"
          value={type}
          options={CONTACT_TYPE_OPTIONS}
          error={errors.fieldErrors.type}
          onChange={(v) => setType(v as ContactType)}
        />
        <Input label="Value" required value={value} error={errors.fieldErrors.value} onChange={(e) => setValue(e.target.value)} />
        <Input label="Label" value={label} error={errors.fieldErrors.label} onChange={(e) => setLabel(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
          Primary contact
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export const ContactInfoSection: React.FC<{ personId: number; contacts: ContactInfo[] }> = ({ personId, contacts }) => {
  const refresh = useRefreshPerson(personId)
  const [editing, setEditing] = useState<ContactInfo | 'new' | null>(null)
  const [deleting, setDeleting] = useState<ContactInfo | null>(null)

  return (
    <SectionShell title="Contact information" addLabel="Add contact" addTask="people.contact_info.create" onAdd={() => setEditing('new')}>
      {contacts.length === 0 ? (
        <EmptyState icon="☎️" title="No contact details" description="Add a phone number or email address." />
      ) : (
        <ul className="divide-y divide-surface-border">
          {contacts.map((contact) => (
            <li key={contact.id} className="flex items-center justify-between py-3 gap-4">
              <div>
                <p className="font-medium text-ink-primary">{contact.value}</p>
                <p className="text-sm text-ink-muted">
                  {labelOf(CONTACT_TYPE_OPTIONS, contact.type)}
                  {contact.label ? ` · ${contact.label}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {contact.is_primary && <Badge variant="primary">Primary</Badge>}
                {contact.is_verified && <Badge variant="success">Verified</Badge>}
                <RowActions
                  label={`contact ${contact.value}`}
                  updateTask="people.contact_info.update"
                  deleteTask="people.contact_info.delete"
                  onEdit={() => setEditing(contact)}
                  onDelete={() => setDeleting(contact)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <ContactForm personId={personId} contact={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete contact"
          message={`Delete ${deleting.value}? This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => {
            await peopleService.deleteContactInfo(deleting.id)
            toast.success('Contact deleted')
            refresh()
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </SectionShell>
  )
}

// ------------------------------------------------------------------- Addresses

const AddressForm: React.FC<{ personId: number; address?: Address; onClose: () => void }> = ({
  personId,
  address,
  onClose,
}) => {
  const refresh = useRefreshPerson(personId)
  const errors = useServerErrors()
  const [form, setForm] = useState({
    type: (address?.type ?? 'mailing') as AddressType,
    street: address?.street ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    postal_code: address?.postal_code ?? '',
    country: address?.country ?? '',
    is_primary: address?.is_primary ?? false,
  })
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const mutation = useMutation({
    mutationFn: () =>
      address ? peopleService.updateAddress(address.id, form) : peopleService.createAddress(personId, form),
    onSuccess: () => {
      toast.success(address ? 'Address updated' : 'Address added')
      refresh()
      onClose()
    },
    onError: errors.fail,
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    errors.clear()
    const missing: Record<string, string> = {}
    if (!form.street.trim()) missing.street = 'Street is required'
    if (!form.city.trim()) missing.city = 'City is required'
    if (Object.keys(missing).length) {
      errors.setFieldErrors(missing)
      return
    }
    mutation.mutate()
  }

  return (
    <Modal title={address ? 'Edit address' : 'Add address'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {errors.formError && <Alert variant="error">{errors.formError}</Alert>}
        <LabeledSelect id="address-type" label="Type" value={form.type} options={ADDRESS_TYPE_OPTIONS} error={errors.fieldErrors.type} onChange={(v) => set('type', v as AddressType)} />
        <Input label="Street" required value={form.street} error={errors.fieldErrors.street} onChange={(e) => set('street', e.target.value)} />
        <Input label="City" required value={form.city} error={errors.fieldErrors.city} onChange={(e) => set('city', e.target.value)} />
        <Input label="State / province" value={form.state} error={errors.fieldErrors.state} onChange={(e) => set('state', e.target.value)} />
        <Input label="Postal code" value={form.postal_code} error={errors.fieldErrors.postal_code} onChange={(e) => set('postal_code', e.target.value)} />
        <Input label="Country" value={form.country} error={errors.fieldErrors.country} onChange={(e) => set('country', e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_primary} onChange={(e) => set('is_primary', e.target.checked)} />
          Primary address
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export const AddressesSection: React.FC<{ personId: number; addresses: Address[] }> = ({ personId, addresses }) => {
  const refresh = useRefreshPerson(personId)
  const [editing, setEditing] = useState<Address | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Address | null>(null)

  return (
    <SectionShell title="Addresses" addLabel="Add address" addTask="people.addresses.create" onAdd={() => setEditing('new')}>
      {addresses.length === 0 ? (
        <EmptyState icon="🏠" title="No addresses" description="Add a mailing or permanent address." />
      ) : (
        <ul className="divide-y divide-surface-border">
          {addresses.map((address) => (
            <li key={address.id} className="flex items-center justify-between py-3 gap-4">
              <div>
                <p className="font-medium text-ink-primary">{address.street}</p>
                <p className="text-sm text-ink-muted">
                  {[address.city, address.state, address.postal_code, address.country].filter(Boolean).join(', ')} ·{' '}
                  {labelOf(ADDRESS_TYPE_OPTIONS, address.type)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {address.is_primary && <Badge variant="primary">Primary</Badge>}
                <RowActions
                  label={`address ${address.street}`}
                  updateTask="people.addresses.update"
                  deleteTask="people.addresses.delete"
                  onEdit={() => setEditing(address)}
                  onDelete={() => setDeleting(address)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <AddressForm personId={personId} address={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete address"
          message={`Delete the address "${deleting.street}"? This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => {
            await peopleService.deleteAddress(deleting.id)
            toast.success('Address deleted')
            refresh()
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </SectionShell>
  )
}

// ----------------------------------------------------------- Identity documents

const DocumentForm: React.FC<{ personId: number; document?: IdentityDocument; onClose: () => void }> = ({
  personId,
  document: existing,
  onClose,
}) => {
  const refresh = useRefreshPerson(personId)
  const errors = useServerErrors()
  const [type, setType] = useState<IdentityDocumentType>(existing?.type ?? 'cnic')
  const [number, setNumber] = useState(existing?.document_number ?? '')
  const [issueDate, setIssueDate] = useState(existing?.issue_date ?? '')
  const [expiryDate, setExpiryDate] = useState(existing?.expiry_date ?? '')
  const [authority, setAuthority] = useState(existing?.issuing_authority ?? '')
  const [file, setFile] = useState<File | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        type,
        document_number: number.trim(),
        issue_date: issueDate || (existing ? '' : null),
        expiry_date: expiryDate || (existing ? '' : null),
        issuing_authority: authority.trim(),
        document_file: file,
      }
      return existing
        ? peopleService.updateIdentityDocument(existing.id, payload)
        : peopleService.createIdentityDocument(personId, payload)
    },
    onSuccess: () => {
      toast.success(existing ? 'Document updated' : 'Document added')
      refresh()
      onClose()
    },
    onError: errors.fail,
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    errors.clear()
    if (!number.trim()) {
      errors.setFieldErrors({ document_number: 'Document number is required' })
      return
    }
    mutation.mutate()
  }

  return (
    <Modal title={existing ? 'Edit identity document' : 'Add identity document'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {errors.formError && <Alert variant="error">{errors.formError}</Alert>}
        <LabeledSelect id="document-type" label="Type" value={type} options={DOCUMENT_TYPE_OPTIONS} error={errors.fieldErrors.type} onChange={(v) => setType(v as IdentityDocumentType)} />
        <Input label="Document number" required value={number} error={errors.fieldErrors.document_number} onChange={(e) => setNumber(e.target.value)} />
        <Input label="Issue date" type="date" value={issueDate ?? ''} error={errors.fieldErrors.issue_date} onChange={(e) => setIssueDate(e.target.value)} />
        <Input label="Expiry date" type="date" value={expiryDate ?? ''} error={errors.fieldErrors.expiry_date} onChange={(e) => setExpiryDate(e.target.value)} />
        <Input label="Issuing authority" value={authority} error={errors.fieldErrors.issuing_authority} onChange={(e) => setAuthority(e.target.value)} />
        <FileUpload
          id="document-file"
          label={existing?.document_file ? 'Replace scanned copy' : 'Scanned copy'}
          accept="application/pdf,image/*"
          error={errors.fieldErrors.document_file}
          maxSize={10 * 1024 * 1024}
          onChange={(files) => setFile(files?.[0] ?? null)}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export const IdentityDocumentsSection: React.FC<{ personId: number; documents: IdentityDocument[] }> = ({
  personId,
  documents,
}) => {
  const refresh = useRefreshPerson(personId)
  const { download, error: downloadError, clearError } = useDownload()
  const [editing, setEditing] = useState<IdentityDocument | 'new' | null>(null)
  const [deleting, setDeleting] = useState<IdentityDocument | null>(null)

  return (
    <SectionShell title="Identity documents" addLabel="Add document" addTask="people.identity_documents.create" onAdd={() => setEditing('new')}>
      {downloadError && (
        <div className="mb-3" onClick={clearError}>
          <Alert variant="error">{downloadError}</Alert>
        </div>
      )}
      {documents.length === 0 ? (
        <EmptyState icon="🪪" title="No identity documents" description="Add a CNIC, passport or other ID." />
      ) : (
        <ul className="divide-y divide-surface-border">
          {documents.map((doc) => {
            const path = sameOriginPath(doc.document_file)
            return (
              <li key={doc.id} className="flex items-center justify-between py-3 gap-4">
                <div>
                  <p className="font-medium text-ink-primary">
                    {labelOf(DOCUMENT_TYPE_OPTIONS, doc.type)} · {doc.document_number}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {doc.issuing_authority || 'Authority not recorded'}
                    {doc.expiry_date ? ` · expires ${doc.expiry_date}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {doc.is_verified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Unverified</Badge>}
                  {path && (
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label={`Download ${doc.document_number}`}
                      onClick={() => download(path, { filename: fileNameFromUrl(doc.document_file, `${doc.type}-${doc.document_number}`) })}
                    >
                      Download
                    </Button>
                  )}
                  <RowActions
                    label={`document ${doc.document_number}`}
                    updateTask="people.identity_documents.update"
                    deleteTask="people.identity_documents.delete"
                    onEdit={() => setEditing(doc)}
                    onDelete={() => setDeleting(doc)}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {editing && (
        <DocumentForm personId={personId} document={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete identity document"
          message={`Delete ${deleting.document_number}? The scanned copy will be removed as well.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => {
            await peopleService.deleteIdentityDocument(deleting.id)
            toast.success('Document deleted')
            refresh()
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </SectionShell>
  )
}
