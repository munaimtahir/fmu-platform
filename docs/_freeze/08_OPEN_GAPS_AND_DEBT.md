# Open Gaps and Debt: FMU Platform

This document honestly tracks the remaining technical and functional debt in the repository.

## 1. Closed Debt (Finalized April 2026)

| Item | Impact | Resolution |
|---|---|---|
| **Coverage Goal** | Medium | Raised total coverage to **65%**. Critical logic verified. |
| **Python Alignment** | Low | Aligned Container and Host to **Python 3.12**. |
| **Legacy Imports** | Low | Cleaned `apps.*` references in canonical modules. |
| **Intake Governance** | Medium | PATH A chosen: Formally deprecated from active surface. |
| **Backend Lint** | High | 963 errors fixed. Code is now lint-clean. |
| **Harness Drift** | High | Harness aligned with pilot baseline. 170 tests pass. |

## 2. Technical Debt

| Item | Severity | Impact | Why not fixed? |
|---|---|---|---|
| **Ancillary Coverage**| Low | QA | While core is >80%, some ancillary modules like `compliance` still have some shallow paths. |
| **Reporting Detail** | Low | Functional | Base reporting is verified; extreme multi-year edge cases remain shallow. |

## 3. Functional Gaps

| Item | Status | Impact | Workaround |
|---|---|---|---|
| **Student Intake API** | 🔴 DEPRECATED | Online submission disabled | Form is UI-only and marked "Inactive". |
| **Leave/Rotation/Posting**| ❄️ FROZEN | Missing features | Explicitly out of scope for current baseline. |

## 4. Implementation Ambiguity
- **Historical Docs**: Some files in `docs/` still reference removed modules; preserved for context but marked historical.
