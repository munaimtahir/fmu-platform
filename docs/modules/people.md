# People Module Specification

## Purpose + Boundaries

**Purpose:** Normalized identity and contact data. Students, faculty, and staff reference a shared person record.

**Owns:**
- Person model (central identity)
- ContactInfo (phones, emails)
- Address (mailing, permanent)
- Identity documents, photos

**Must NOT own:**
- Academic information (belongs to students/academics)
- Financial information (belongs to finance)

## Models

### Person
- `id`: AutoField
- `first_name`: CharField
- `middle_name`: CharField, optional
- `last_name`: CharField
- `date_of_birth`: DateField, optional
- `gender`: CharField, choices
- `national_id`: CharField, unique, optional
- `photo`: ImageField, optional
- `created_at`, `updated_at`: DateTimeField

### ContactInfo
- `person`: ForeignKey(Person)
- `type`: CharField (phone, email, emergency_contact)
- `value`: CharField
- `is_primary`: BooleanField
- `is_verified`: BooleanField

### Address
- `person`: ForeignKey(Person)
- `type`: CharField (mailing, permanent, temporary)
- `street`: CharField
- `city`: CharField
- `state`: CharField
- `postal_code`: CharField
- `country`: CharField
- `is_primary`: BooleanField

## APIs

### `/api/people/persons/`
- CRUD endpoints with `people.persons.*` permissions
- Object-level: Users can view own person record

### `/api/people/contact-info/`
- CRUD endpoints with `people.contact_info.*` permissions

### `/api/people/addresses/`
- CRUD endpoints with `people.addresses.*` permissions

## Tests Required

1. CRUD tests
2. Permission tests
3. Object-level permission tests
