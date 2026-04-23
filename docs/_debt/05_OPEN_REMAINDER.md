# Open Remainder

The following debt remains but is non-blocking for Gate 3 completion.

## 1. Technical Debt
- **Total Coverage**: 65%. While high, some legacy modules still have shallow coverage (deferred under freeze).
- **Environment Parity**: Host dev environment might still use non-containerized databases in some setups (documented workaround provided).

## 2. Functional Gaps
- **Reporting Complexity**: While base reporting is verified, extremely complex edge cases involving multiple partial payments across different academic years remain theoretically untested.

## 3. Recommended Next Actions
1. **Pilot Run**: Proceed with the pilot run using the verified baseline.
2. **Post-Freeze Cleanup**: Once the freeze is lifted, consider removing the `apps.intake` module entirely if the React replacement is preferred for all intake.
3. **Continuous Coverage**: Gradually raise coverage target to 75% in the next feature sprint.
