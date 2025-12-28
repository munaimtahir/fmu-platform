# AI Agent Guidelines for FMU SIMS Repository

**IMPORTANT**: This document contains strict rules for any AI agent or automated tool making changes to this repository. All AI agents MUST follow these guidelines without exception.

## Table of Contents

- [Core Principles](#core-principles)
- [Testing Requirements](#testing-requirements)
- [Code Quality Standards](#code-quality-standards)
- [CI/CD and Infrastructure](#cicd-and-infrastructure)
- [Security Requirements](#security-requirements)
- [Branch and Commit Conventions](#branch-and-commit-conventions)
- [Documentation Requirements](#documentation-requirements)
- [Dependency Management](#dependency-management)
- [Human Review Requirements](#human-review-requirements)

## Core Principles

1. **Minimal Changes**: Make the smallest possible changes to accomplish the task
2. **Test-First**: Write or update tests before making code changes
3. **Local Validation**: ALWAYS test locally before pushing
4. **No Breaking Changes**: Never break existing functionality
5. **Human Oversight**: Know when to stop and request human review

## Testing Requirements

### MANDATORY: Run Tests Locally Before Pushing

**You MUST run all tests locally and verify they pass before pushing any code changes.**

```bash
# Backend tests (REQUIRED before any backend changes)
cd backend
export DJANGO_SECRET_KEY=test-secret-key
export DJANGO_DEBUG=False
export DB_ENGINE=django.db.backends.sqlite3
export DB_NAME=/tmp/test_db.sqlite3
export DB_HOST=''
export DB_PORT=0
pytest tests --cov=. --cov-report=html

# Frontend tests (REQUIRED before any frontend changes)
cd frontend
npm test
```

### Test Coverage Requirements

- **Every code change MUST include tests** or a clear justification why tests are impossible
- If tests cannot be created immediately:
  - Add a placeholder test with a TODO comment
  - Create a follow-up GitHub issue to add proper tests
  - Document the reason in the PR description
  - Get explicit human approval before merging

### Placeholder Test Format

When you must add a placeholder test:

```python
# backend/tests/test_feature_name.py
"""
TODO: Add comprehensive tests for [feature name].
Tracking issue: #[issue_number]

Reason for placeholder: [Brief explanation]
"""

def test_placeholder_feature_name():
    """Placeholder test to prevent CI failure."""
    assert True
```

### Never Do This

❌ **DO NOT**:
- Push code without running tests locally
- Remove existing tests to make CI pass
- Disable test coverage checks
- Skip tests with `@pytest.mark.skip` without a detailed explanation and tracking issue
- Change test assertions to make failing tests pass without fixing the underlying issue

## Code Quality Standards

### Linting and Type Checking

**MUST pass before pushing**:

```bash
# Backend
cd backend
ruff check .  # Must pass with no errors
mypy .        # Must pass with no errors

# Frontend
cd frontend
npm run lint  # Must pass with no errors
```

### Auto-fixing

You MAY auto-fix linting issues:

```bash
# Backend
ruff check . --fix

# Frontend
npm run lint -- --fix
```

**BUT**: Always review auto-fixes to ensure they don't change behavior.

## CI/CD and Infrastructure

### CI Configuration Changes

**STRICT REQUIREMENTS** for changes to:
- `.github/workflows/*.yml`
- `pytest.ini`
- `pyproject.toml` (build/test config sections)
- `package.json` (scripts, test config)
- `docker-compose.yml`
- `Dockerfile`

**You MUST**:
1. Provide a detailed explanation of WHY the change is needed
2. Document WHAT will change in CI behavior
3. Include tests that validate the CI change
4. Request explicit human review before merging
5. Test the change locally in a way that simulates the CI environment

**Example of acceptable CI change**:
```yaml
# BEFORE
run: pytest --cov=.

# AFTER (with justification in PR)
run: pytest tests --cov=. --cov-report=xml
# Reason: Explicitly target tests/ directory to avoid collecting
# non-test files. Fixes Job 52490205799 where no tests were found.
```

### Never Do This

❌ **DO NOT**:
- Change CI workflows to skip failing tests
- Disable coverage requirements to make CI pass
- Change Python/Node versions without discussion
- Modify deployment steps without human approval
- Add secrets or credentials to workflow files (use GitHub Secrets)

## Security Requirements

### Secrets and Credentials

**ABSOLUTE RULES**:

1. ❌ **NEVER commit secrets, API keys, passwords, or credentials to the repository**
2. ✅ **ALWAYS use environment variables for sensitive data**
3. ✅ **ALWAYS use GitHub Secrets for CI/CD credentials**
4. ❌ **NEVER log sensitive information**
5. ✅ **ALWAYS review diffs before committing to catch accidental secret exposure**

### Checking for Secrets

Before committing, verify no secrets are present:

```bash
# Check for common secret patterns
git diff | grep -iE "(secret|password|api[_-]?key|token|credential)"

# If matches found, review carefully to ensure they're not real secrets
```

### What to Do If You Find a Secret

If you discover a committed secret:

1. **STOP immediately**
2. **DO NOT try to fix it yourself**
3. **Notify the repository owner immediately**
4. **Document the location and type of secret found**

## Branch and Commit Conventions

### Branch Naming

**REQUIRED format**:

```
<type>/<short-description>

Types:
- fix/     - Bug fixes
- feat/    - New features
- chore/   - Maintenance (deps, configs, docs)
- refactor/ - Code refactoring
- test/    - Test additions/fixes
```

**Examples**:
```
fix/user-login-validation
feat/attendance-qr-scanner
chore/update-django-version
test/add-enrollment-tests
```

### Commit Messages

**REQUIRED format**:

```
<type>: <short description>

<detailed explanation if needed>

<references to issues/PRs if applicable>
```

**Examples**:
```
fix: correct attendance percentage calculation

The previous calculation didn't account for excused absences.
Now properly excludes them from the denominator.

Fixes #123
```

```
test: add placeholder test for user enrollment

TODO: Replace with comprehensive enrollment tests
Tracking issue: #456
```

### Never Do This

❌ **DO NOT**:
- Use vague commit messages like "fix bug" or "update code"
- Commit unrelated changes together
- Force push to main or protected branches
- Rebase/rewrite history on shared branches

## Documentation Requirements

### When to Update Documentation

Update documentation when you:

- Add or modify API endpoints → Update `Docs/API.md`
- Change data models → Update `Docs/DATAMODEL.md`
- Modify environment variables → Update `Docs/ENV.md` and `.env.example`
- Change setup steps → Update `README.md` or `Docs/SETUP.md`
- Add new features → Update `CHANGELOG.md`

### Documentation Standards

- Keep documentation in sync with code
- Use clear, concise language
- Include examples for complex features
- Update relevant diagrams if they exist

## Dependency Management

### Adding Dependencies

**STRICT REQUIREMENTS**:

1. **Justify the need**: Explain why existing libraries can't solve the problem
2. **Research the package**:
   - Check maintenance status (last update, open issues)
   - Review security advisories
   - Consider bundle size (frontend)
   - Check license compatibility
3. **Document in PR**: Explain what the dependency does and why it's needed
4. **Update lock files**: Always commit updated `requirements.txt` or `package-lock.json`

### Updating Dependencies

**CAREFUL APPROACH**:

1. **Check breaking changes**: Read CHANGELOG/migration guides
2. **Update one at a time**: Don't batch unrelated updates
3. **Test thoroughly**: Run full test suite
4. **Document changes**: Note any required code changes in PR

### Version Pinning

- **Backend**: Pin exact versions in `requirements.txt` (e.g., `Django==5.1.4`)
- **Frontend**: Use `package-lock.json` for reproducible builds

### Never Do This

❌ **DO NOT**:
- Add dependencies without justification
- Update major versions without testing
- Remove dependencies without checking usage
- Use deprecated or unmaintained packages

## Human Review Requirements

### MANDATORY Human Review For

The following changes **REQUIRE explicit human approval** before merging:

1. **Production Configuration**:
   - Database settings
   - Environment variable changes
   - CORS/security settings
   - Deployment configurations

2. **CI/CD Pipeline**:
   - Workflow changes
   - Test configuration modifications
   - Coverage threshold changes

3. **Security-Related**:
   - Authentication/authorization logic
   - Permission checks
   - Data validation
   - API security settings

4. **Breaking Changes**:
   - API endpoint modifications
   - Database schema changes
   - Major refactoring

5. **Dependency Updates**:
   - Major version updates
   - New production dependencies
   - Framework updates

### When to Stop and Ask

**STOP and request human guidance when**:

- You encounter unexpected test failures
- The fix requires major architectural changes
- You find security vulnerabilities
- You need to modify production configurations
- The change affects multiple systems
- You're unsure about the correct approach
- Tests are failing for unclear reasons

### Providing Context

When stopping for human review, provide:

1. **What you were trying to do**
2. **What you've done so far**
3. **What the problem/blocker is**
4. **What options you've considered**
5. **Your recommendation (if any)**

## Pull Request Requirements

### PR Description Template

Every PR MUST include:

```markdown
## Description
[Clear description of what changed and why]

## Related Issues
Fixes #[issue number]
Related to #[issue number]

## Changes Made
- [Bullet point list of changes]

## Testing
- [ ] Local tests pass
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Manual testing performed (describe)

## Documentation
- [ ] Documentation updated
- [ ] CHANGELOG updated (if applicable)

## Screenshots (if UI changes)
[Include screenshots]

## Checklist
- [ ] Tests added/updated
- [ ] CI passing
- [ ] No secrets committed
- [ ] Human review requested (if required)
```

### Before Submitting PR

**CHECKLIST**:

- [ ] All tests pass locally
- [ ] Linting passes
- [ ] Type checking passes
- [ ] No secrets in code
- [ ] Documentation updated
- [ ] Clear PR description
- [ ] Related issues linked
- [ ] Appropriate reviewers tagged

## Emergency Procedures

### If CI Fails After Your Changes

1. **Review the failure logs immediately**
2. **Check if it's related to your changes**
3. **If yes**:
   - Fix the issue locally
   - Test thoroughly
   - Push the fix
4. **If no** (pre-existing failure):
   - Document that it's unrelated
   - Note in PR that failure existed before your changes

### If You Accidentally Commit a Secret

1. **Immediately notify repository owner**
2. **Do NOT try to fix by force-pushing**
3. **Assume the secret is compromised**
4. **Follow the team's incident response procedure**

## Compliance Verification

Before every commit, verify:

```bash
# ✅ Tests pass
cd backend && pytest tests
cd frontend && npm test

# ✅ Linting passes
cd backend && ruff check .
cd frontend && npm run lint

# ✅ Type checking passes (backend)
cd backend && mypy .

# ✅ No secrets committed
git diff | grep -iE "(secret|password|api[_-]?key|token)" || echo "✓ No obvious secrets found"

# ✅ Coverage artifacts generated (if running coverage)
ls backend/coverage.xml backend/htmlcov/ || echo "⚠ Coverage files missing"
```

## Summary: The Golden Rules

1. ✅ **ALWAYS test locally before pushing**
2. ✅ **ALWAYS include tests with code changes**
3. ✅ **ALWAYS run linting and type checking**
4. ❌ **NEVER commit secrets or credentials**
5. ❌ **NEVER change CI without justification and review**
6. ❌ **NEVER skip tests to make CI pass**
7. ✅ **ALWAYS request human review when required**
8. ✅ **ALWAYS document your changes**
9. ✅ **ALWAYS use proper branch naming**
10. ✅ **ALWAYS provide clear commit messages**

## Enforcement

Violations of these guidelines may result in:

- PR rejection
- Request for complete rework
- Removal of commit access for automated tools
- Manual review requirements for all future changes

These guidelines exist to maintain code quality, security, and reliability. Following them helps the entire team work effectively and safely.

---

**Last Updated**: 2025-10-27
**Version**: 1.1

## Additional Resources

For autonomous release execution by AI agents, see:
- **[AUTONOMOUS_RELEASE_PROMPT.md](Docs/AUTONOMOUS_RELEASE_PROMPT.md)** - Comprehensive 7-phase release execution guide
- **[AUTONOMOUS_RELEASE_QUICKSTART.md](Docs/AUTONOMOUS_RELEASE_QUICKSTART.md)** - Quick reference guide
- **[validate_release.sh](validate_release.sh)** - Automated validation script

These documents provide structured guidance for AI agents performing complete release workflows.
