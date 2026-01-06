# SIMS – LOCKED SYSTEM BLUEPRINT (AUTHORITY DOCUMENT)

**Status:** LOCKED  
**Applies to:** Backend, Frontend, APIs, Permissions, Workflows, Unattended AI Development  
**Rule:** This document is the single source of truth for SIMS structure and governance.  
No module, model, API, or workflow may be altered in contradiction to this document.

---

## 1. System Philosophy (Non-Negotiable)

SIMS is a **governance-grade academic system**, not a CRUD app.

Design priorities, in order:
1. Correctness over speed
2. Auditability over convenience
3. Explicit workflows over silent mutation
4. Policy separation (academics ≠ finance ≠ identity)
5. AI-safe unattended development with hard guardrails

---

## 2. Global Invariants (Apply to ALL Modules)

### 2.1 Universal Permission Model (Task-Based RBAC)
- Permissions are defined as **permission tasks**, not roles.
- Tasks can be assigned to:
  - roles
  - individual users
- New roles can be created without code changes.
- Every API endpoint MUST declare required permission task(s).
- Object-level rules apply where relevant (e.g., students only access their own records).

### 2.2 Mandatory Audit Logging
- Every write operation (create, update, delete, state transition, special action) MUST generate an audit record containing:
  - actor
  - timestamp
  - entity + entity_id
  - action
  - summary
  - request metadata
- Audit records are immutable.
- Retention policy applies; deletion through UI is forbidden.

### 2.3 State Machines (No Free Editing)
- Any entity with lifecycle meaning MUST use explicit states.
- Immutable states block direct edits.
- Changes after lock states must occur via **Requests** workflow.

### 2.4 Conflict & Concurrency Safety
- Capacity-based and irreversible actions (e.g., enrollment, publish/freeze, financial posting) must be:
  - transaction-safe
  - conflict-aware
- Failures must return explicit, consistent errors.

### 2.5 Core Gravity Center Rule
- Modules are independent Django apps.
- **core** owns shared rules, enums, permissions, and base models.
- No module may duplicate core responsibilities.

---

## 3. Locked Module Graph (FINAL)

### 0) core
**Purpose:** System foundation and rule authority.  
**Owns:** users, roles, permission tasks, assignments, shared base models, global enums, validators, institution settings.

**Locked decision:** All permission logic and shared invariants live here and nowhere else.

---

### 1) audit
**Purpose:** Immutable accountability layer.  
**Owns:** audit event model, middleware, filters, exports, admin viewer.

**Locked decision:** Every write action across the system must generate an audit event.

---

### 2) people (identity)
**Purpose:** Normalized identity and contact data.  
**Owns:** Person, ContactInfo (phones/emails), Address (mailing/permanent), identity documents, photos.

**Locked decision:** Students, faculty, and staff reference a shared person record; identity data is never duplicated.

---

### 3) academics
**Purpose:** Academic structure definition (the skeleton).  
**Owns:** Program, Course/Batch, Term/TimePeriod, Section, faculty assignment, capacity, term open/close.

**Locked decision:** Terms may overlap (parallel blocks/rotations allowed); closed terms block academic writes.

---

### 4) students
**Purpose:** Student registry and lifecycle record.  
**Owns:** student profile, academic bindings (enrollment year, expected/actual graduation), status, leave periods.

**Locked decision:** Absence leave does NOT count toward time-to-graduation; students cannot directly edit authoritative fields.

---

### 5) requests
**Purpose:** Universal change-request and approval workflow.  
**Owns:** request types, state machine, approvals, attachments, remarks, student-visible history.

**Locked decision:** Any post-lock or sensitive change must flow through Requests; no exceptions.

---

### 6) enrollment
**Purpose:** Academic binding between students and sections/terms.  
**Owns:** enrollment records, capacity enforcement, duplicate prevention, term validation, enrollment history.

**Locked decision:** Enrollment is transaction-safe, capacity-aware, and forbidden in closed terms.

---

### 7) finance
**Purpose:** Financial governance, billing, and compliance.  
**Owns:** fee structures, student ledger (debit/credit), invoices, receipts, concessions, refunds, financial reports.

**Explicit exclusions:**
- Finance does NOT control:
  - enrollment
  - attendance
  - exams
  - result publishing

**Locked decision:** Finance is ledger-based and fully audited; academic decisions are never implicitly blocked by payment state unless policy explicitly says so.

---

### 8) attendance
**Purpose:** Attendance capture and eligibility computation.  
**Owns:** attendance records, same-day edit rules, eligibility logic, defaulter reports, exports.

**Locked decision:** Past attendance edits are restricted; eligibility rules are configurable but explicit.

---

### 9) assessments
**Purpose:** Assessment structure and score capture.  
**Owns:** assessment definitions, types, weight validation, score limits, score records.

**Locked decision:** Total assessment weight per section must equal 100%; invalid schemes are rejected.

---

### 10) results
**Purpose:** Result computation and lifecycle control.  
**Owns:** result records, state machine (draft → published → frozen), publish/freeze actions.

**Locked decision:** Published or frozen results are immutable; corrections occur only via Requests.

---

### 11) documents
**Purpose:** Official academic documents.  
**Owns:** transcripts, certificates, async generation, QR/token verification, public verify endpoints.

**Locked decision:** Documents are verifiable independently via secure tokens; generation may be asynchronous.

---

### 12) notifications
**Purpose:** Unified outbound communication layer.  
**Owns:** templates, email/SMS/WhatsApp sending, delivery logs, queue integration.

**Locked decision:** No module sends messages directly; all outbound communication passes through Notifications.

---

### 13) admin_portal (frontend structure)
**Purpose:** Single administrative control surface.  
**Owns:** navigation, dashboards, module entry points, role-aware UI exposure.

**Locked decision:** Admin UI exposes all defined elements but respects permission tasks strictly.

---

## 4. Locked High-Impact Workflows

### 4.1 Student Profile Correction
Student → submits request → admin review → approve/reject → audit log → student sees outcome.

### 4.2 Post-Publish Result Correction
Published/frozen result → correction request → approval → new audited record or reversal.

### 4.3 Enrollment Integrity
Concurrent enrollment attempts → one succeeds → others fail cleanly with reason.

### 4.4 Financial Corrections
Incorrect financial entry → reversal entry → new corrected entry (no mutation).

---

## 5. Documentation & Unattended Development Rules

### 5.1 Canonical Module Specs
Each module must maintain:
