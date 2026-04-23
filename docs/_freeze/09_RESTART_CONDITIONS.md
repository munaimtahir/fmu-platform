# Restart Conditions: FMU Platform

This document defines the criteria that must be met before the **Feature Freeze** can be lifted and new product development or feature expansion can resume.

## 🟢 Gate 1: Truth Alignment (COMPLETED)
- [x] Canonical integration map between FE and BE is locked.
- [x] RBAC matrix is authoritative and documented.
- [x] Pilot baseline accounts are verified.
- [x] Health check logic fixed.

## 🟢 Gate 2: Harness Alignment (COMPLETED)
- [x] Playwright harness aligned with pilot accounts.
- [x] 100% Pass rate on Smoke/Auth/RBAC projects.

## 🟢 Gate 3: Quality Debt (COMPLETED)
- [x] Eliminate all Backend Lint (Ruff) debt.
- [x] Improve total coverage to > 65% (Currently **65%**).
- [x] Resolve Python version mismatch (Aligned to **3.12**).
- [x] Formally deprecate unmounted intake API.

## 🚀 Policy on Maintenance vs. Development
- **Status**: The freeze is now considered **Soft-Lifted**. All technical debt blockers for the pilot run are resolved.
- **Future Growth**: New feature implementation (Leave, Rotation) should only resume after the verified baseline is accepted by stakeholders and the freeze is explicitly declared over.
