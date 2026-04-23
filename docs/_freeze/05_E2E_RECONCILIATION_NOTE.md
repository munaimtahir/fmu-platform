# E2E Reconciliation Note: FMU Platform

This document explains the status of the Playwright E2E suites following the Debt Remediation sprint.

## 1. Context: Historical Drift
Following the repository reset, the Playwright harness failed due to stale credentials (`admin` vs `pilot_admin`) and missing demo data dependencies.

## 2. Remediation (April 2026)
The harness has been successfully aligned with the **Frozen Pilot Baseline**:
- **Credentials**: `frontend/e2e/data/test-data.ts` now uses `pilot_*` accounts with `password123`.
- **Zero-Data Stability**: Locators in role-based specs (`admin`, `registrar`, `student`) have been updated to handle "Empty State" UI correctly.
- **Setup Simplification**: `global.setup.ts` now uses existing pilot accounts instead of attempting to create new ones via unmounted or removed APIs.

## 3. Current Status
- **Smoke & Auth**: 🟢 PASS on clean baseline.
- **Role-Based Workflows**: 🟢 PASS on clean baseline (handling empty lists).
- **Public Routes**: 🟢 PASS (including Intake form verification).

## 4. Interpretation for Future Engineers
The Playwright signal is once again **Authoritative**. Any failure in the `smoke`, `auth`, or `rbac` projects should be treated as a regression in application logic or infrastructure.
Tests that require specific domain data (e.g., results for a specific student) are still subject to "Domain Data Setup" as defined in the Pilot Baseline Policy.
