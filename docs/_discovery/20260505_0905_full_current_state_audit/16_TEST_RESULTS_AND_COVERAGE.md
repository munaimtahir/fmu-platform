# 16. Test Results and Coverage

**Date Executed**: Tue May 5 09:20 UTC 2026

## Backend
- **Runner**: Pytest
- **Status**: 19 tests failed (at minimum). The majority of failures involve `test_faculty_imports.py` and `test_wave2_business_logic.py`.
- **Ruff**: 189 style/lint errors found.

## Frontend
- **Runner**: Vitest
- **Status**: 48 passed, 1 failed. The failure is in `src/api/axios.test.ts`.
- **Lint**: Passed.
- **Type-Check**: Passed.

## Blockers for Coverage
Full coverage reports were not completed because of the pending migrations preventing a fully clean local run and numerous test failures that should be resolved first.