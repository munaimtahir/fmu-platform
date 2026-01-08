# FMU Platform Recovery Documentation

This directory contains comprehensive documentation for the FMU Platform schema recovery and verification process.

## Overview

The FMU Platform experienced schema misalignment issues where database schema was behind the code model definitions. This recovery effort identified all gaps, created necessary migrations, and documented complete verification procedures.

## Directory Structure

```
docs/
├── README.md                           (This file)
├── diagnostics/                        (Problem diagnosis)
│   ├── 00_inventory.md                (System baseline)
│   └── 03_migrations_status.md        (Schema analysis + migrations created)
├── api/                                (API documentation)
│   └── API_MAP.md                     (Complete endpoint catalog)
├── verification/                       (Testing procedures)
│   ├── FRONTEND_COVERAGE_MATRIX.md    (UI coverage analysis)
│   └── VERIFICATION_PLAYBOOK.md       (Step-by-step verification)
└── reports/                            (Final reports)
    └── MASTER_RECOVERY_REPORT.md      (Complete recovery summary)
```

## Quick Start

### For DevOps / System Administrators

1. **Read the problem**: Start with `reports/MASTER_RECOVERY_REPORT.md`
2. **Apply migrations**: Follow migration instructions in `diagnostics/03_migrations_status.md`
3. **Verify system**: Execute `verification/VERIFICATION_PLAYBOOK.md`
4. **Run smoke tests**: Execute `scripts/smoke_test.sh`

### For Developers

1. **Understand the system**: Read `diagnostics/00_inventory.md`
2. **Review API surface**: See `api/API_MAP.md`
3. **Check frontend needs**: Review `verification/FRONTEND_COVERAGE_MATRIX.md`
4. **Follow best practices**: See lessons learned in `reports/MASTER_RECOVERY_REPORT.md`

### For QA / Testers

1. **Verification procedures**: Follow `verification/VERIFICATION_PLAYBOOK.md`
2. **Test cases**: Use checklist in playbook
3. **Smoke tests**: Run `scripts/smoke_test.sh` after deployment
4. **Report issues**: Reference specific sections in documentation

## Key Documents

### 🚨 Critical - Read First
- **`reports/MASTER_RECOVERY_REPORT.md`** - Executive summary, root causes, fixes applied

### 🔧 Technical - For Implementation
- **`diagnostics/03_migrations_status.md`** - Migration details and application procedures
- **`verification/VERIFICATION_PLAYBOOK.md`** - Step-by-step verification (7 phases)

### 📚 Reference - For Development
- **`api/API_MAP.md`** - Complete API endpoint catalog (60+ endpoints)
- **`verification/FRONTEND_COVERAGE_MATRIX.md`** - UI coverage and missing screens
- **`diagnostics/00_inventory.md`** - System architecture and configuration

## Problem Summary

### Original Errors
```
ERROR: column students_student.person_id does not exist
ERROR: column academics_program.structure_type does not exist
```

### Root Causes
1. **Missing migrations** - New model fields never migrated
2. **Model-schema divergence** - Code updated without DB update
3. **Incomplete app setup** - People app added but never migrated

### Solution
Created **5 new migrations** (+769 lines) to bridge schema gap:
1. People app initial migration (Person, ContactInfo, Address, IdentityDocument)
2. Students person field + enrollment tracking
3. Students LeavePeriod model
4. Academics Program structure fields
5. Academics new models (Period, Track, LearningBlock, Module)

## Migration Status

### Files Created
- `backend/sims_backend/people/migrations/0001_initial.py`
- `backend/sims_backend/students/migrations/0003_student_person_enrollment_fields.py`
- `backend/sims_backend/students/migrations/0004_leaveperiod.py`
- `backend/sims_backend/academics/migrations/0003_program_structure_fields.py`
- `backend/sims_backend/academics/migrations/0004_new_academic_models.py`

### Application Commands
```bash
# Check migration status
docker compose exec backend python manage.py showmigrations

# Apply migrations
docker compose exec backend python manage.py migrate

# Verify with smoke test
./scripts/smoke_test.sh
```

## Expected Outcomes

After migrations applied:
- ✅ No "column does not exist" errors
- ✅ Admin Program pages work (structure_type field visible)
- ✅ Admin Student pages work (person field available)
- ✅ People admin accessible
- ✅ API accepts all new fields
- ✅ Frontend create/edit flows persist data
- ✅ End-to-end data flow functional

## Frontend Status

### Coverage Statistics
- **Total Backend Resources**: 36
- **Resources with Frontend**: 11 (31%)
- **Full CRUD Coverage**: 4 resources (11%)
- **No Coverage**: 25 resources (69%)

### Missing Screens
**~70 pages need to be built** for complete coverage:
- **Priority 1 (Critical)**: 30 screens - People, Students, Timetable, Courses
- **Priority 2 (High)**: 15 screens - Academic structure, Leave management
- **Priority 3 (Medium)**: 15 screens - Batches, Groups, Departments CRUD
- **Priority 4 (Polish)**: 10 screens - Admin placeholders

**Estimated Effort**: 75-100 hours

See `verification/FRONTEND_COVERAGE_MATRIX.md` for details.

## API Documentation

Complete API map available in `api/API_MAP.md`:
- **11 modules** documented
- **60+ endpoints** cataloged
- **CRUD operations** for all resources
- **Permission matrix** (6 roles × 9 modules)
- **Request/response schemas** for key resources
- **Error handling** and conventions

Quick reference:
- Authentication: `/api/auth/login/`, `/api/auth/me/`
- People: `/api/people/persons/`
- Students: `/api/students/`, `/api/leave-periods/`
- Academics: `/api/academics/programs/`, etc.
- Full list in API_MAP.md

## Verification Process

The verification playbook provides step-by-step procedures:

### Phase 1: Backend Health
- Health endpoint check
- Schema verification (SQL queries)
- ORM smoke tests (Python code)

### Phase 2: Django Admin
- Program admin (structure_type field)
- Student admin (person field)
- People admin (all models)

### Phase 3: API Endpoints
- Authentication (login/token)
- CRUD operations (all resources)
- Field validation

### Phase 4: Frontend
- Login flow
- Program create/edit
- Data persistence check

### Phase 5-7: Logs, Persistence, Error Check
- Database log review
- End-to-end persistence verification
- No 500 errors check

See `verification/VERIFICATION_PLAYBOOK.md` for complete procedures.

## Smoke Testing

Automated smoke test script available:

```bash
# Run from project root
./scripts/smoke_test.sh

# With custom settings
API_URL=http://localhost:8010 \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=yourpassword \
./scripts/smoke_test.sh
```

Tests:
- Health endpoints
- Authentication
- API endpoint accessibility (10+ endpoints)
- Create/delete operations
- Schema verification (SQL checks)

## Current Status

### ✅ Complete
- Baseline inventory
- Schema analysis
- Migration creation
- API documentation
- Frontend coverage analysis
- Verification playbook
- Master recovery report
- Smoke test script

### ⏸️ Blocked
- Migration application (requires Docker containers)
- System verification (requires containers)
- Live testing (requires containers)

**Blocker**: Docker SSL certificate issue prevents container startup

### 📋 Next Steps
1. Resolve Docker SSL certificate issue
2. Start containers: `docker compose up -d`
3. Apply migrations: `docker compose exec backend python manage.py migrate`
4. Run verification: Follow `verification/VERIFICATION_PLAYBOOK.md`
5. Execute smoke tests: `./scripts/smoke_test.sh`
6. Build Priority 1 frontend screens (30 screens, ~30-40 hours)

## Lessons Learned

### What Went Well
- ✅ Comprehensive code analysis identified all gaps
- ✅ Surgical migrations minimize risk
- ✅ Documentation-first approach
- ✅ Nullable fields prevent data loss

### Recommendations
- ⚠️ Generate migrations immediately after model changes
- ⚠️ Add pre-commit hook for unmigrated changes
- ⚠️ Include migration check in CI pipeline
- ⚠️ Add schema validation tests

## Support & Troubleshooting

### Common Issues

**Issue**: Migrations won't apply
- Check: `docker compose exec backend python manage.py showmigrations`
- Fix: Resolve any conflicts, then `migrate`

**Issue**: Still getting "column does not exist"
- Check: Database logs `docker compose logs fmu_db`
- Fix: Verify correct database being used, not stale volume

**Issue**: Admin 500 errors persist
- Check: Backend logs `docker compose logs backend`
- Fix: Review stack trace for specific error

**Issue**: Frontend can't save data
- Check: Browser console for API errors
- Fix: Verify auth token, check serializer validation

See `verification/VERIFICATION_PLAYBOOK.md` troubleshooting section for more.

## Contributing

When adding new features:
1. **Update models** → **Create migration** → **Apply** → **Test**
2. Document API changes in `api/API_MAP.md`
3. Update frontend coverage matrix if adding UI
4. Run smoke tests before committing
5. Update verification playbook if procedures change

## References

- **Django Migrations**: https://docs.djangoproject.com/en/5.1/topics/migrations/
- **DRF Documentation**: https://www.django-rest-framework.org/
- **React 19**: https://react.dev/
- **Docker Compose**: https://docs.docker.com/compose/

## Contact

For questions about this recovery:
- **Technical Issues**: Review master recovery report
- **Migration Questions**: See migrations status document
- **Verification Help**: Follow verification playbook
- **API Questions**: Reference API map

---

**Last Updated**: 2026-01-08  
**Status**: Documentation complete, awaiting container startup for execution  
**Next Milestone**: Apply migrations and run verification
