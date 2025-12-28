# Quick Start Guide for Autonomous Release Execution

This guide helps you quickly get started with the FMU SIMS autonomous release execution framework.

## 📚 Overview

The autonomous release execution framework provides:
1. **Comprehensive Release Prompt** - Step-by-step guide for AI agents
2. **Validation Script** - Automated release readiness checks
3. **Phase-based Approach** - 7 distinct phases from backend to deployment

## 🚀 Quick Start

### For AI Agents

1. **Read the Main Prompt**: Start with `Docs/AUTONOMOUS_RELEASE_PROMPT.md`
2. **Understand Context**: Review the repository structure and current state
3. **Execute Phases**: Follow phases 1-7 in sequence
4. **Validate**: Use `./validate_release.sh` after each phase
5. **Document**: Update completion reports as you progress

### For Humans

1. **Review Current State**:
   ```bash
   ./validate_release.sh
   ```

2. **Provide to Agent**: Share these documents with your AI agent:
   - `Docs/AUTONOMOUS_RELEASE_PROMPT.md` (main execution guide)
   - `Docs/ACCEPTANCE_CHECKLIST.md` (acceptance criteria)
   - `Docs/FINAL_AI_DEVELOPER_PROMPT.md` (development guidelines)

3. **Monitor Progress**: Check agent's completion of phase checklists

4. **Validate Deliverables**: After each phase, run validation script

## 📋 Seven Phases

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| 1 | Backend Verification | Tests passing, migrations clean, 80%+ coverage |
| 2 | Frontend Integration | UI functional, API integrated, 70%+ coverage |
| 3 | E2E Testing | Full stack working, workflows tested |
| 4 | Security & Governance | RBAC working, secrets externalized, scans clean |
| 5 | CI/CD & Deployment | Pipelines green, Docker builds, staging works |
| 6 | Documentation | Docs updated, screenshots captured, changelog current |
| 7 | Release & Verification | Tagged, artifacts published, production ready |

## 🔍 Validation Checks

The `validate_release.sh` script checks:

- ✅ **Backend**: Tests (≥80% coverage), linters (ruff, mypy)
- ✅ **Frontend**: Tests (≥70% coverage), linter (eslint)
- ✅ **Docker**: Compose files, Dockerfiles, Nginx config
- ✅ **Security**: .env handling, secrets, hardcoded credentials
- ✅ **CI/CD**: GitHub Actions workflows
- ✅ **Docs**: Critical documentation files present
- ✅ **Release**: Version tags, demo data, Makefile

## 🎯 Success Criteria

Before release, ensure:

1. **All Tests Pass**
   ```bash
   make test
   ```

2. **All Linters Pass**
   ```bash
   make lint
   ```

3. **Docker Build Works**
   ```bash
   docker compose up --build
   ```

4. **Demo Data Seeds**
   ```bash
   make demo
   ```

5. **Validation Script Passes**
   ```bash
   ./validate_release.sh
   ```

6. **CI/CD Pipelines Green**
   - Check GitHub Actions status

## 📖 Key Documents

| Document | Purpose |
|----------|---------|
| `AUTONOMOUS_RELEASE_PROMPT.md` | Main execution guide for AI agents |
| `ACCEPTANCE_CHECKLIST.md` | PR acceptance criteria |
| `FINAL_AI_DEVELOPER_PROMPT.md` | Development guidelines and guardrails |
| `COMPLETION_REPORT.md` | Current project status |
| `CI-CD.md` | Pipeline configuration details |
| `DATA-GOVERNANCE.md` | Privacy and compliance requirements |

## 🔧 Common Commands

```bash
# Full validation
./validate_release.sh

# Quick setup and demo
make demo

# Run all tests
make test

# Run all linters
make lint

# Start Docker services
make docker-up

# Stop Docker services
make docker-down

# Clean build artifacts
make clean
```

## 🤖 AI Agent Instructions

To use this framework with an AI agent:

1. **Provide Full Context**:
   ```
   Please review the FMU SIMS repository and execute the autonomous 
   release process defined in Docs/AUTONOMOUS_RELEASE_PROMPT.md.
   Start with Phase 1 and proceed through all 7 phases.
   ```

2. **Set Expectations**:
   - Execute phases in order
   - Complete all checklist items
   - Validate deliverables before proceeding
   - Document progress in completion reports

3. **Monitor Progress**:
   - Review phase completion
   - Check deliverables against criteria
   - Run validation script between phases

4. **Provide Feedback**:
   - If agent gets stuck, provide specific guidance
   - Reference relevant documentation sections
   - Break down complex tasks into smaller steps

## 🆘 Troubleshooting

### Validation Script Fails

1. **Check specific errors**: The script provides detailed output
2. **Review logs**: Check application and CI logs
3. **Run targeted tests**: Test specific components in isolation
4. **Consult docs**: Review relevant documentation sections

### Tests Failing

1. **Backend**: `cd backend && pytest tests -v`
2. **Frontend**: `cd frontend && npm test`
3. **Check coverage**: Ensure thresholds are met
4. **Review recent changes**: Isolate problematic code

### Docker Issues

1. **Check logs**: `docker compose logs`
2. **Rebuild**: `docker compose down && docker compose up --build`
3. **Check resources**: Ensure Docker has sufficient memory/disk
4. **Clean up**: `docker system prune -a`

## 📞 Support

- **Issues**: Create GitHub issue with details
- **Questions**: Check existing documentation first
- **Bugs**: Provide steps to reproduce
- **Feature Requests**: Describe use case and benefits

## 📈 Success Metrics

Release is ready when:

- ✅ All validation checks pass (green output)
- ✅ Backend coverage ≥80%, Frontend ≥70%
- ✅ No HIGH/CRITICAL security vulnerabilities
- ✅ CI/CD pipelines green
- ✅ Documentation complete and current
- ✅ Demo environment functional
- ✅ Version tagged and pushed

---

**Next Steps**: Start with `./validate_release.sh` to see current status, then review `Docs/AUTONOMOUS_RELEASE_PROMPT.md` for detailed execution guide.
