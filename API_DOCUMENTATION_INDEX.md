# FMU SIMS Backend API - Documentation Index

## 📚 Documentation Files

This exploration has generated comprehensive API documentation for the FMU Platform Student Information Management System (SIMS) backend.

### 1. **BACKEND_API_STRUCTURE.md** (18 KB)
**Comprehensive reference guide with complete details**

- **10 major sections** covering all aspects of the API
- **Full endpoint documentation** - All 50+ endpoints with HTTP methods and parameters
- **Complete model definitions** - Every field with type, constraints, and help text
- **Serializer information** - Field mapping for requests/responses
- **Fixture examples** - JSON examples for creating test data
- **Authentication workflow** - Login/logout/refresh patterns
- **Relationship diagrams** - Visual representation of data dependencies
- **Key development patterns** - Common API usage patterns

**Use this when you need:**
- Detailed information about specific endpoints
- Complete model field definitions
- Fixture building reference
- Understanding data relationships
- API architecture overview

---

### 2. **BACKEND_API_QUICK_REFERENCE.txt** (13 KB)
**Quick lookup guide for developers**

- **Organized by endpoint category** - Auth, Academics, Students, etc.
- **Quick model summary** - Key fields for each model
- **Management commands** - All 6 commands with descriptions
- **Test fixture examples** - Quick JSON templates
- **App directory structure** - Visual organization
- **Key insights** - Important notes and warnings
- **Tabular format** - Easy scanning and reference

**Use this when you need:**
- Quick endpoint lookup
- Fast model field reference
- Management command names
- Test fixture templates
- Quick visual reference

---

## 🎯 What You'll Find

### API Endpoints (50+)
- **Authentication** (6 endpoints)
- **Core RBAC** (5 endpoints)
- **Academics** (11 endpoints)
- **Students** (3 endpoints)
- **Attendance** (9 endpoints)
- **Timetable** (3 endpoints)
- **Exams & Results** (4 endpoints)
- **Finance** (9 endpoints)
- **Notifications** (2 endpoints)
- **Transcripts** (3 endpoints)
- **People** (4 endpoints)
- **Admin** (3 endpoints)
- **Specialized** (9+ endpoints)

### Core Models (40+)
- **Student** - Registration, status, academic binding
- **Attendance** - Session presence tracking
- **Leave Period** - Student leave requests
- **Result Header** - Exam results (workflow states)
- **Result Component Entry** - Per-component marks
- **Program** - Academic programs
- **Batch** - Student cohorts
- **Session** - Timetable sessions
- **Voucher** - Payment requests
- **Academic Period** - Year/Block/Module hierarchy
- **+ 30 more** - Finance, Finance, People, Exams, etc.

### Management Commands (6)
- `seed_demo.py` - Full demo data seeding
- `seed_demo_scenarios.py` - Test scenarios
- `seed_academics_demo.py` - Academic-specific data
- `generate_login_credentials.py` - User credentials
- `create_role_groups.py` - RBAC setup
- `test_admin_urls.py` - URL validation

---

## 🚀 Quick Start for Test Fixture Building

### Step 1: Understand the Data Model
Read: **BACKEND_API_STRUCTURE.md** → Section 3 (Core Data Models)

### Step 2: Choose Your Endpoints
Reference: **BACKEND_API_QUICK_REFERENCE.txt** → API ENDPOINTS section

### Step 3: Build Fixtures
Follow: **BACKEND_API_STRUCTURE.md** → Section 7 (Test Fixture Examples)

### Step 4: Check Relationships
Review: **BACKEND_API_STRUCTURE.md** → Section 10 (Key Relationships)

### Step 5: Authenticate
Follow: **BACKEND_API_STRUCTURE.md** → Section 9 (Authentication Workflow)

---

## ⚠️ Critical Information

### BATCH.start_year is GRADUATION Year!
**NOT intake year!**
- Example: Student enrolling 2024 in 5-year program → batch.start_year = 2029
- Document: BACKEND_API_STRUCTURE.md, Section 3, BATCH model

### Result Header Workflow
**DRAFT → VERIFIED → PUBLISHED → FROZEN**
- Only DRAFT results are editable
- Document: BACKEND_API_STRUCTURE.md, Section 3, RESULT_HEADER model

### Attendance Uniqueness
**No duplicate (session, student) pairs allowed**
- Each session can only have one attendance record per student
- Document: BACKEND_API_STRUCTURE.md, Section 3, ATTENDANCE model

### Leave Period Types
**ABSENCE type does NOT count toward graduation**
- Document: BACKEND_API_STRUCTURE.md, Section 3, LEAVE_PERIOD model

---

## 📍 Documentation Structure

### BACKEND_API_STRUCTURE.md Sections:
1. Main URL Configuration
2. All URLs.py Files & Endpoints by App
3. Core Data Models & Fields
4. Management Commands
5. Fixture Files
6. Quick API Fixture Building Reference
7. Key Relationships Diagram
8. Common Development Patterns
9. Authentication Workflow
10. Key Insights for API-Backed Test Fixtures

### BACKEND_API_QUICK_REFERENCE.txt Sections:
- System Overview
- Key Endpoints Quick Lookup (organized by feature)
- Core Models & Key Fields
- Management Commands
- Apps Directory Structure
- Important Relationships
- Test Fixture Examples
- Files Location

---

## 🔍 Finding Specific Information

### Looking for...

**Student API endpoints?**
→ BACKEND_API_QUICK_REFERENCE.txt, line 47-50

**Attendance model fields?**
→ BACKEND_API_STRUCTURE.md, Section 3, ATTENDANCE MODEL

**How to create a student via API?**
→ BACKEND_API_STRUCTURE.md, Section 7, "Create Student Fixture"

**Finance/Voucher endpoints?**
→ BACKEND_API_QUICK_REFERENCE.txt, line 62-67

**All model relationships?**
→ BACKEND_API_STRUCTURE.md, Section 10, "Key Relationships Diagram"

**Management commands?**
→ BACKEND_API_STRUCTURE.md, Section 4 or BACKEND_API_QUICK_REFERENCE.txt, line 85

**Result/Exam workflow?**
→ BACKEND_API_STRUCTURE.md, Section 3, RESULT_HEADER MODEL

**Authentication process?**
→ BACKEND_API_STRUCTURE.md, Section 9

---

## 📊 Statistics

| Item | Count |
|------|-------|
| Total Apps | 20 |
| URL Files | 21 |
| API Endpoints | 50+ |
| Model Classes | 40+ |
| Serializer Classes | 50+ |
| Management Commands | 6 |
| Fixture Files | 0 (uses commands) |
| Documentation Lines | 939 total |
| - Comprehensive Guide | 667 lines |
| - Quick Reference | 272 lines |

---

## 🎓 Learning Path

**For First-Time Users:**
1. Start with BACKEND_API_QUICK_REFERENCE.txt (5 min read)
2. Read BACKEND_API_STRUCTURE.md Section 1-2 (10 min)
3. Review Section 10 - Key Insights (5 min)
4. Check Section 7 - Fixture Examples (10 min)

**For Test Fixture Building:**
1. Read Section 3 - Core Models
2. Reference Section 7 - Fixture Examples
3. Check Section 10 - Key Relationships
4. Use Quick Reference for endpoint lookups

**For API Integration:**
1. Start with Section 9 - Authentication
2. Review Section 8 - Common Patterns
3. Check specific endpoint in Section 2
4. Reference serializers in model section

---

## 📁 File Locations

All documentation files are located in the project root:
```
/home/munaim/srv/apps/fmu-platform/
├── BACKEND_API_STRUCTURE.md         (Comprehensive reference)
├── BACKEND_API_QUICK_REFERENCE.txt  (Quick lookup)
└── API_DOCUMENTATION_INDEX.md       (This file)
```

Backend source code:
```
/home/munaim/srv/apps/fmu-platform/backend/
├── config/urls.py                   (Main URL config)
├── core/urls.py                     (RBAC endpoints)
├── sims_backend/urls.py             (Root API, auth, health)
└── sims_backend/                    (20 apps)
    ├── academics/
    ├── students/
    ├── attendance/
    ├── timetable/
    ├── results/
    ├── finance/
    └── ... (14 more apps)
```

---

## ✅ Checklist for Using This Documentation

- [ ] Read appropriate documentation section for your task
- [ ] Identify required vs optional fields
- [ ] Check for unique constraints (e.g., batch in academics)
- [ ] Review model relationships before creating fixtures
- [ ] Verify authentication requirements
- [ ] Check for workflow states (e.g., result status)
- [ ] Test with sample fixture data first
- [ ] Use OpenAPI schema at `/api/schema/` for live validation
- [ ] Refer to `/api/docs/` for interactive Swagger UI

---

## 🔗 Related Resources

**Live API Documentation:**
- Swagger UI: `/api/docs/`
- ReDoc: `/api/redoc/`
- OpenAPI Schema: `/api/schema/`

**Source Code:**
- Models: Each app's `models.py`
- Serializers: Each app's `serializers.py`
- Views: Each app's `views.py`
- URLs: Each app's `urls.py`

**Management Commands:**
- Location: `/backend/core/management/commands/`
- Usage: `python manage.py [command_name]`

---

## 📞 Questions?

Refer to the appropriate documentation file:
- **Specific endpoint or model** → BACKEND_API_STRUCTURE.md
- **Quick lookup** → BACKEND_API_QUICK_REFERENCE.txt
- **Navigation help** → This file (API_DOCUMENTATION_INDEX.md)

---

**Generated:** March 7, 2024  
**Status:** Complete API reference for test fixture building  
**Format:** Markdown + Text  
**Total Size:** 44 KB of documentation

