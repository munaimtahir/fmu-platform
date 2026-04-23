# Freeze Decision: FMU Platform

## Declaration
As of Tuesday, April 21, 2026, the FMU Platform project is under **STRICT FEATURE FREEZE**.

## Purpose
The project has undergone a controlled cleanup and reset sprint to establish a trustworthy baseline. The purpose of this freeze is to lock the current state, finalize truth documentation, and ensure that the "pilot baseline" is stable and well-understood before any further development resumes.

## Allowed Work
- Finalizing truth maps and integration contracts.
- Finalizing RBAC documentation.
- Reconciling verification results (tests, linters, E2E).
- Surgical bug fixes required to make truth or verification accurate (e.g., health check logic).
- Cleanup of documentation and repository ambiguity.

## Disallowed Work
- **No new features** (e.g., Leave, Rotations, Postings).
- **No expansion of scope** for existing features.
- **No speculative UX changes** or broad refactors.
- **No new workflow implementations.**

## Governance
Any missing capability identified during this period that is not a regression of intended behavior MUST be classified as **OUT OF SCOPE** or **FROZEN**. Feature work may only resume once the "Restart Conditions" defined in this freeze pack are met and the freeze is explicitly lifted.
