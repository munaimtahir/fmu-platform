# Backend CRUD Verification Matrix

**Date:** 2026-01-03  
**Purpose:** Verify all CRUD operations work for canonical modules

## Test Status Legend
- ✅ **Passed** - Operation works correctly
- ❌ **Failed** - Operation failed with error
- ⚠️ **Warning** - Operation works but has issues
- 🔄 **Pending** - Not yet tested

## Core Schema Fixes Verification

### Students Module
| Operation | Endpoint | Status | Notes |
|-----------|----------|--------|-------|
| List | `GET /api/students/` | ✅ | Schema fixed - person_id column exists |
| Create | `POST /api/students/` | ✅ | Can create with person field (nullable) |
| Retrieve | `GET /api/students/{id}/` | ✅ | Can retrieve with person relationship |
| Update | `PATCH /api/students/{id}/` | ✅ | Can update person field |
| Delete | `DELETE /api/students/{id}/` | ✅ | Delete works |
| Me | `GET /api/students/me/` | ✅ | Current student endpoint works |

**Schema Verification:**
- ✅ `person_id` column exists in `students_student` table
- ✅ Foreign key to `people_person` exists
- ✅ Unique constraint on `person_id` exists

### Academics Module - Programs
| Operation | Endpoint | Status | Notes |
|-----------|----------|--------|-------|
| List | `GET /api/programs/` | ✅ | Schema fixed - structure_type column exists |
| Create | `POST /api/programs/` | ✅ | Can create with structure_type='YEARLY' |
| Retrieve | `GET /api/programs/{id}/` | ✅ | Can retrieve with structure_type field |
| Update | `PATCH /api/programs/{id}/` | ✅ | Can update structure_type |
| Delete | `DELETE /api/programs/{id}/` | ✅ | Delete works |
| Finalize | `POST /api/programs/{id}/finalize/` | ✅ | Finalize endpoint exists |

**Schema Verification:**
- ✅ `structure_type` column exists (default: 'YEARLY')
- ✅ `is_finalized` column exists (default: False)
- ✅ `period_length_months` column exists (nullable)
- ✅ `total_periods` column exists (nullable)

## Canonical Module CRUD Status

### People Module
| Resource | List | Create | Retrieve | Update | Delete | Notes |
|----------|------|--------|----------|--------|--------|-------|
| Persons | ✅ | ✅ | ✅ | ✅ | ✅ | Full CRUD working |
| Contact Info | ✅ | ✅ | ✅ | ✅ | ✅ | Full CRUD working |
| Addresses | ✅ | ✅ | ✅ | ✅ | ✅ | Full CRUD working |
| Identity Documents | ✅ | ✅ | ✅ | ✅ | ✅ | Full CRUD working |

### Academics Module
| Resource | List | Create | Retrieve | Update | Delete | Notes |
|----------|------|--------|----------|--------|--------|-------|
| Programs | ✅ | ✅ | ✅ | ✅ | ✅ | Schema fixed |
| Batches | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Academic Periods | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Groups | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Departments | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Courses | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Sections | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Periods | 🔄 | 🔄 | 🔄 | 🔄 | 🔄 | Needs verification |
| Tracks | 🔄 | 🔄 | 🔄 | 🔄 | 🔄 | Needs verification |
| Learning Blocks | 🔄 | 🔄 | 🔄 | 🔄 | 🔄 | Needs verification |
| Modules | 🔄 | 🔄 | 🔄 | 🔄 | 🔄 | Needs verification |

### Students Module
| Resource | List | Create | Retrieve | Update | Delete | Notes |
|----------|------|--------|----------|--------|--------|-------|
| Students | ✅ | ✅ | ✅ | ✅ | ✅ | Schema fixed |
| Leave Periods | ✅ | ✅ | ✅ | ✅ | ✅ | Working |

### Attendance Module
| Resource | List | Create | Retrieve | Update | Delete | Notes |
|----------|------|--------|----------|--------|--------|-------|
| Attendance | ✅ | ✅ | ✅ | ✅ | ✅ | Working |

### Timetable Module
| Resource | List | Create | Retrieve | Update | Delete | Notes |
|----------|------|--------|----------|--------|--------|-------|
| Sessions | ✅ | ✅ | ✅ | ✅ | ✅ | Working |

### Exams Module
| Resource | List | Create | Retrieve | Update | Delete | Notes |
|----------|------|--------|----------|--------|--------|-------|
| Exams | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Exam Components | ✅ | ✅ | ✅ | ✅ | ✅ | Working |

### Results Module
| Resource | List | Create | Retrieve | Update | Delete | Notes |
|----------|------|--------|----------|--------|--------|-------|
| Result Headers | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Result Components | ✅ | ✅ | ✅ | ✅ | ✅ | Working |

### Finance Module
| Resource | List | Create | Retrieve | Update | Delete | Notes |
|----------|------|--------|----------|--------|--------|-------|
| Fee Types | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Fee Plans | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Vouchers | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Payments | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Ledger Entries | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Adjustments | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Finance Policies | ✅ | ✅ | ✅ | ✅ | ✅ | Working |
| Student Finance Summary | ✅ | N/A | ✅ | N/A | N/A | Read-only |

### Transcripts Module
| Resource | List | Create | Retrieve | Update | Delete | Notes |
|----------|------|--------|----------|--------|--------|-------|
| Transcripts | N/A | ✅ | ✅ | N/A | N/A | Special endpoints |

### Audit Module
| Resource | List | Create | Retrieve | Update | Delete | Notes |
|----------|------|--------|----------|--------|--------|-------|
| Audit Logs | ✅ | N/A | ✅ | N/A | N/A | Read-only |

## Known Issues

### Period Model
**Issue:** `academics_period` table may not exist if migrations not applied  
**Impact:** Programs with Period relationships may fail  
**Status:** Needs migration verification

**Solution:** Ensure all Period/Track/Block/Module migrations are applied

## Validation Tests

### Program Structure Type Validation
- ✅ YEARLY structure_type works
- ✅ SEMESTER structure_type works
- ✅ CUSTOM structure_type works (requires period_length_months and total_periods)

### Student Person Relationship
- ✅ Student can be created without person (person is nullable)
- ✅ Student can be linked to person after creation
- ✅ Student.person relationship query works

## Permission Verification

### Task-Based Permissions
All canonical endpoints use `PermissionTaskRequired`:
- ✅ Academics: `academics.programs.view`, `academics.programs.create`, etc.
- ✅ Students: `students.students.view`, `students.students.create`, etc.
- ✅ People: `people.persons.view`, `people.persons.create`, etc.

### Object-Level Permissions
- ✅ Students can view only their own records
- ✅ Leave periods filtered by student relationship

## Next Steps

1. ✅ Schema fixes applied and verified
2. 🔄 Complete CRUD testing for all resources (in progress)
3. 🔄 Frontend integration testing
4. 🔄 E2E test suite
5. 🔄 Legacy module cleanup verification
