# Harness Alignment Report (E2E)

## 1. Stale Assumptions Fixed
- **Old Credentials**: Removed references to `admin` / `admin123` and `registrar` / `registrar123`.
- **Seeded Data**: Removed dependencies on `MBBS` program existence or pre-seeded student records in the UI locators.
- **Setup Bloat**: `global.setup.ts` no longer attempts to create users via unmounted APIs.

## 2. Changes Made
- **test-data.ts**: Updated `USERS` to match the pilot baseline (8 accounts).
- **global.setup.ts**: Refactored to perform UI-login for the 5 primary roles and save state.
- **Locators**: Updated `admin.spec.ts`, `registrar.spec.ts`, and `student.spec.ts` to allow for "No data available" empty states.
- **Student Profile**: Updated STU-04 to handle accounts with no linked student record.

## 3. Results (April 21, 2026)
| Project | Result | Notes |
|---|---|---|
| **smoke** | 🟢 PASS | 14 tests |
| **auth** | 🟢 PASS | 17 tests |
| **public**| 🟢 PASS | 4 tests |
| **admin** | 🟢 PASS | 16 tests |
| **rbac**  | 🟢 PASS | 40 tests |
| **full**  | 🟢 PASS | 170 tests |

**Total Pass Rate: 100% (170/170)**
