# Vexel MedSIMS — Android Development & Agent Operational Context

**Status:** Authoritative operational context for Android development  
**Project:** Vexel MedSIMS  
**Repository:** `munaimtahir/fmu-platform`  
**Canonical production URL:** `https://sims.vexel.pk`  
**Last updated:** 2026-09-09

---

## 1. Purpose

This document provides the operational context that any AI agent, developer, or automation process should read **before performing Android development or Android-related backend integration work** for Vexel MedSIMS.

It describes:

- the canonical repository;
- the production/backend environment;
- the development laptop;
- the Android emulator;
- the Caddy deployment model;
- Git synchronization expectations;
- safety boundaries;
- Android-to-backend integration principles.

This document is intended to prevent future agents from having to rediscover the development topology or accidentally use obsolete infrastructure assumptions.

---

## 2. Product Identity

The application is:

**Vexel MedSIMS**

It is a configurable medical-college Student Information and Academic Management System.

The platform identity and institution identity are separate concepts.

Do not reintroduce legacy FMU/PMC-specific branding unless a task explicitly concerns historical/archive material.

Canonical production identity:

```text
Product: Vexel MedSIMS
Production URL: https://sims.vexel.pk
API namespace: https://sims.vexel.pk/api/
```

The Android application should use the same production backend rather than introducing a separate Android-specific backend.

---

## 3. Canonical Git Repository

GitHub repository:

```text
https://github.com/munaimtahir/fmu-platform
```

SSH remote:

```text
git@github.com:munaimtahir/fmu-platform
```

Both the development laptop and the production/integration VM are linked to this repository.

### Agent rule

Before any development work, always inspect the actual Git state.

Recommended initial commands:

```bash
git status --short
git branch --show-current
git rev-parse HEAD
git log -5 --oneline
git remote -v
git fetch origin
```

Do not assume an old branch, SHA, tag, archive ZIP, or historical document is still the current repository baseline.

The **live Git state is authoritative** when an execution session begins.

Do not rewrite locked tags or force-push unless explicitly instructed and justified.

---

## 4. Development Laptop

The local laptop is the primary Android development environment.

Expected responsibilities:

- Android SDK and Gradle execution;
- Kotlin/Compose development;
- Android unit tests;
- emulator/instrumentation testing;
- Android build generation;
- Android UI evidence capture;
- Git commits and pushes.

Android development should normally occur on the laptop rather than on the backend VM.

---

## 5. Dedicated Android Emulator

A dedicated Android Virtual Device is configured on the development laptop:

```text
AVD name: sims
```

This emulator is dedicated to Vexel MedSIMS Android development.

Agents are explicitly permitted to:

- start and stop it;
- wipe/factory-reset it;
- clear application data;
- uninstall/reinstall MedSIMS;
- change its Android version;
- recreate the AVD;
- replace it with a more appropriate API-level image;
- modify emulator configuration where the Android task requires it.

Do not delete or modify unrelated AVDs unless a task explicitly requires it.

### Preferred target

For current Android development, prefer an Android 16 / API 36-capable environment unless a later Android requirement supersedes it.

Future testing should eventually include:

- primary current API emulator;
- at least one older supported API;
- phone-sized layout;
- expanded/tablet layout where practical.

---

## 6. Backend / Integration VM

The Vexel MedSIMS backend is running on a Google Cloud VM.

The development laptop can access it using the SSH host alias:

```bash
ssh test
```

The application repository on the VM is:

```text
/home/munaim/srv/apps/fmu-platform
```

### VM role

The VM should be treated primarily as the:

- backend integration environment;
- deployment environment;
- PostgreSQL/Redis/RQ application host;
- HTTPS integration target;
- place to validate shared backend/API changes.

Android-only changes normally do **not** require VM modification or deployment.

---

## 7. Public Android-to-Backend Connectivity

The Android app should normally communicate with the backend directly over HTTPS through:

```text
https://sims.vexel.pk/
```

Example canonical API request:

```text
https://sims.vexel.pk/api/auth/login/
```

Do not require SSH tunnelling for ordinary Android application testing unless investigating a specific infrastructure problem.

### Important base-URL rule

Use a base URL strategy that prevents accidental duplication such as:

```text
/api/api/...
```

Preferred conceptual structure:

```text
Base URL:
https://sims.vexel.pk/

Endpoint:
api/auth/login/
```

The exact Retrofit convention may differ, but there must be one clearly defined API-prefix policy.

---

## 8. Caddy Deployment Architecture

The active reverse proxy is **Caddy running on the VM host**.

Caddy handles:

- public HTTPS;
- TLS certificate management;
- reverse proxying;
- routing to the application services.

The maintained Caddy configuration source is:

```text
/home/munaim/srv/config/caddy/CaddyFile
```

The corresponding system Caddy configuration is:

```text
/etc/caddy/Caddyfile
```

The maintained source and system configuration should remain synchronized.

### Caddy modification rule

If a task genuinely requires a Caddy change:

1. inspect the current maintained Caddy source;
2. modify the maintained source first;
3. validate the proposed Caddy configuration;
4. synchronize it to the system Caddy file using the established deployment process;
5. validate the system configuration;
6. reload/restart Caddy only if required;
7. verify the affected HTTPS routes;
8. confirm existing production routes remain healthy.

Do not casually edit only `/etc/caddy/Caddyfile` and leave the maintained Caddy source inconsistent.

Do not modify Caddy for an Android-only feature unless there is a real networking/routing requirement.

---

## 9. Shared Backend Principle

Android must be a first-class native client of the existing MedSIMS backend.

Architecture:

```text
                    Vexel MedSIMS
                          |
                   Django / DRF
                          |
             +------------+------------+
             |                         |
        React Web                 Native Android
          Client                     Client
```

There must remain **one authoritative backend**.

The Android application must not duplicate server business logic.

Backend-authoritative rules include, where applicable:

- authentication;
- RBAC and object permissions;
- student access boundaries;
- enrolment constraints;
- attendance rules;
- attendance eligibility;
- assessment rules;
- examination workflows;
- result lifecycle;
- verification/publication/freeze rules;
- result correction/change approvals;
- transcript generation and verification;
- financial authorization;
- audit logging.

Client-side checks may improve user experience but cannot replace backend validation.

---

## 10. Android Target

The long-term target is:

> A fully native Android application with functional parity to the Vexel MedSIMS web application, using the same Django/DRF backend.

Android should provide **functional parity**, not pixel-for-pixel replication of the React UI.

Mobile workflows should be redesigned appropriately for:

- phones;
- touch interaction;
- small screens;
- tablets/expanded layouts;
- accessibility;
- intermittent connectivity.

Do not implement the web application inside a WebView.

Preferred implementation direction:

```text
Kotlin
Jetpack Compose
Material 3
ViewModel
Coroutines / Flow
Navigation Compose
Hilt
Retrofit / OkHttp
Kotlinx Serialization
Room where justified
DataStore
WorkManager where justified
Android Keystore
```

Use currently compatible stable Android dependencies rather than blindly following versions from historical documentation.

---

## 11. API Contract Rule

Before implementing a major Android feature, inspect the **actual current backend implementation and current OpenAPI schema**.

Do not rely solely on older `docs/API.md`, archived completion reports, or older generated OpenAPI files.

Recommended sources, in order of authority:

1. current backend code;
2. freshly generated current OpenAPI schema;
3. current frontend API integration;
4. current tests;
5. current active documentation;
6. historical/archive documentation only for context.

If documentation conflicts with current implementation, investigate and document the discrepancy rather than silently assuming the older documentation is correct.

---

## 12. Authentication

The current Android client should integrate with the canonical backend authentication contract discovered from the current backend.

Historically/currently expected endpoints include:

```text
POST  /api/auth/login/
POST  /api/auth/logout/
POST  /api/auth/refresh/
GET   /api/auth/me/
```

Additional current profile/password endpoints may also be available.

Always verify against the current backend before implementation.

### Security requirements

Do not reproduce browser `localStorage` token handling.

Android authentication should use an appropriate secure mobile design, including:

- short-lived access token handling;
- protected refresh-token storage;
- Android Keystore-backed cryptographic protection where appropriate;
- safe refresh-token rotation;
- single-flight token refresh;
- no token logging;
- no password logging;
- clean session invalidation after unrecoverable authentication failure.

The backend remains authoritative for authentication and authorization.

---

## 13. Roles and Permissions

Do not hardcode only the original five roles without inspecting the current backend.

Historically the system includes roles such as:

```text
Admin
Registrar
Faculty
Student
ExamCell
```

The newer platform may also expose roles such as:

```text
Coordinator
Finance
Office Assistant
```

and potentially additional configured role/group concepts.

Before designing navigation or permissions:

1. inspect the current backend role model;
2. inspect current frontend role handling;
3. identify canonical role names;
4. map Android navigation from backend role/permission information;
5. keep server-side permissions authoritative.

The Android client must not broaden access simply because a screen is reachable.

---

## 14. Current Functional Scope

Agents should not assume MedSIMS is limited to the original minimal academic modules.

The current platform may include functionality across domains such as:

- authentication and RBAC;
- students;
- people;
- faculty;
- programmes;
- batches/cohorts;
- academic periods;
- courses;
- sections/groups;
- departments;
- timetable;
- attendance;
- examination management;
- gradebook/assessment;
- results;
- transcripts;
- finance;
- notifications;
- learning/materials;
- compliance;
- syllabus;
- system configuration;
- audit/administration.

Every Android parity sprint should derive its exact scope from the current repository.

---

## 15. Recommended Development Flow

### Android-only change

```text
Laptop
  |
  +-- implement Android change
  +-- unit tests
  +-- build
  +-- emulator test on sims
  +-- integration test against https://sims.vexel.pk
  +-- capture evidence
  +-- commit/push
```

No backend deployment should occur unless needed.

### Shared backend/API change

```text
Inspect current API
        |
Implement generic backend improvement
        |
Backend tests
        |
Frontend regression if affected
        |
Commit/push
        |
Update VM checkout
        |
Migrate only if required
        |
Restart only affected services
        |
Health/API validation
        |
Android integration test
```

Do not create Android-only business endpoints when a shared generic API improvement is appropriate.

Bad pattern:

```text
/api/android/results/
```

Preferred pattern:

```text
shared canonical results endpoint
        |
        +-- Web
        +-- Android
```

---

## 16. Git Synchronization Between Laptop and VM

Because both systems use the same GitHub repository, Git should be the normal synchronization mechanism.

Avoid manually copying source trees between the laptop and VM when Git can represent the change.

Before pulling/deploying on the VM:

```bash
cd /home/munaim/srv/apps/fmu-platform
git status --short
git branch --show-current
git rev-parse HEAD
git fetch origin
```

Do not overwrite uncommitted VM changes.

Do not perform destructive reset operations unless the task specifically requires them and the current state has been inspected first.

---

## 17. Production Safety Rules

The backend environment may contain real or production-like application data.

Agents must avoid destructive production operations unless explicitly required.

Do not casually:

- delete PostgreSQL volumes;
- recreate the production database;
- purge media;
- wipe user data;
- run destructive seed commands;
- reset production credentials;
- delete Caddy certificates;
- reset Docker volumes;
- run broad `docker system prune --volumes`;
- factory-reset anything on the VM.

The `sims` Android emulator is disposable; the backend VM is not.

Before schema-changing backend work:

- inspect migrations;
- understand data impact;
- create/verify rollback or backup strategy as appropriate;
- run tests;
- avoid destructive migrations where a safe alternative exists.

---

## 18. Secrets and Privileged Access

Local/VM privileged access may be available to an execution session.

However:

**No reusable password, sudo credential, database credential, API token, signing key, SSH private key, JWT, or other secret may be written into this repository documentation.**

Agents must never commit secrets to:

- Markdown files;
- source code;
- Gradle files;
- `strings.xml`;
- `BuildConfig`;
- `.env.example`;
- CI workflows;
- screenshots;
- audit evidence;
- test fixtures.

If privileged access is required, use credentials supplied securely to the current execution session or existing passwordless mechanisms.

Never echo secrets into logs or completion reports.

---

## 19. Android Signing

### Canonical Play upload signing

MedSIMS Play upload signing is initialized on the development laptop. Future release builds must reuse `$HOME/.config/vexel/medsims-signing/medsims-upload.jks` and its canonical credential file `$HOME/.config/vexel/medsims-signing/signing.properties`. Do not generate a new upload key except through a deliberate Google Play upload-key reset/recovery process.

Do not commit:

- release keystores;
- keystore passwords;
- signing passwords;
- private signing material.

Debug signing may use the normal local Android debug mechanism.

Production signing should use the project's established secure signing workflow when that stage is reached.

---

## 20. Evidence & Audit

Major Android sprints should create/update a structured audit package where appropriate, for example:

```text
ANDROID_AUDIT/
├── BASELINE/
├── API_CONTRACT/
├── ARCHITECTURE/
├── BUILD/
├── TESTS/
├── EMULATOR/
├── SECURITY/
└── FINAL_REPORT.md
```

Do not store secrets or real authentication tokens inside evidence.

Emulator screenshots should be sanitized if they contain sensitive personal information.

---

## 21. Emulator Evidence Expectations

For major UI/application sprints, capture evidence from the dedicated `sims` emulator.

Typical evidence:

```text
launch
login
validation/error state
authenticated home
navigation
profile
light theme
dark theme
logout
session restoration
feature-specific workflows
```

Do not claim a workflow is completed merely because a placeholder screen renders.

---

## 22. Testing Expectations

Android changes should normally pass all applicable gates:

```text
Gradle build
Android unit tests
Android lint/static checks
Compose UI tests where applicable
emulator smoke test
real backend/API integration where safe
```

If backend code is changed, run relevant backend regression tests.

If a shared API contract or frontend-dependent behavior changes, run appropriate frontend regression tests.

Do not disable failing tests merely to obtain a green build.

---

## 23. Documentation Drift

Some older repository documents may still contain legacy references such as:

- FMU;
- old repository names;
- previous domains;
- nginx deployment assumptions;
- older module lists;
- older role models;
- older result state machines.

These should not automatically override the current deployed reality.

For Android development, the current authoritative operational assumptions are:

```text
Product: Vexel MedSIMS
Production: https://sims.vexel.pk
GitHub: github.com/munaimtahir/fmu-platform
VM SSH alias: test
VM repository: /home/munaim/srv/apps/fmu-platform
Reverse proxy: host-level Caddy
Caddy source: /home/munaim/srv/config/caddy/CaddyFile
System Caddyfile: /etc/caddy/Caddyfile
Dedicated Android AVD: sims
```

If these facts change, update this document.

---

## 24. First-Step Checklist for Any Android Agent

Before writing Android code:

```text
[ ] Read this document.
[ ] Inspect live Git state.
[ ] Inspect current backend/API.
[ ] Inspect current frontend behavior for the feature.
[ ] Verify current role/permission contract.
[ ] Verify production health if integration testing is planned.
[ ] Inspect local Android SDK/Gradle environment.
[ ] Inspect the sims AVD.
[ ] Create/use an appropriate feature branch.
[ ] Define evidence and test gates.
```

Before finishing:

```text
[ ] Build passes.
[ ] Tests pass.
[ ] Emulator validation passes.
[ ] No secrets are committed.
[ ] Git diff is reviewed.
[ ] Backend was not modified unnecessarily.
[ ] Documentation reflects meaningful contract changes.
[ ] Evidence is captured where required.
[ ] Final report states exact tested scope and remaining work.
```

---

## 25. Core Agent Directive

For Android work on Vexel MedSIMS:

> Prefer discovery over assumption, shared backend contracts over client-specific business logic, Git synchronization over manual source copying, emulator destruction over production destruction, and reproducible evidence over unsupported claims.

The goal is a native Android application that becomes a first-class client of the same Vexel MedSIMS platform without destabilizing the existing web application or backend.
