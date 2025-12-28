# Autonomous Release Framework - Documentation Guide

Welcome to the FMU SIMS Autonomous Release Framework documentation. This guide helps you navigate the framework and understand how to use it effectively.

---

## 📚 Documentation Overview

The autonomous release framework consists of four main documents:

### 1. [AUTONOMOUS_RELEASE_PROMPT.md](AUTONOMOUS_RELEASE_PROMPT.md) ⭐ START HERE
**Primary execution guide for AI agents**

- **Purpose:** Comprehensive step-by-step guide for executing a complete release
- **Audience:** AI agents, automation tools, release managers
- **Length:** 618 lines (~20KB)
- **Content:**
  - 7 detailed release phases
  - 100+ checklist items
  - Specific commands for each phase
  - Expected deliverables
  - Success criteria
  - Reference documentation links
  - Constraints and guidelines

**When to use:** This is the main document AI agents should follow to execute a release from start to finish.

---

### 2. [AUTONOMOUS_RELEASE_QUICKSTART.md](AUTONOMOUS_RELEASE_QUICKSTART.md) 🚀 QUICK REFERENCE
**Quick reference and getting started guide**

- **Purpose:** Fast onboarding and command reference
- **Audience:** Humans, developers, quick lookups
- **Length:** 201 lines (~5.7KB)
- **Content:**
  - Quick start instructions
  - 7-phase summary table
  - Key commands reference
  - Common workflows
  - Troubleshooting guide
  - Success metrics checklist

**When to use:** When you need a quick overview or command reference without reading the full prompt.

---

### 3. [AUTONOMOUS_RELEASE_EXAMPLE.md](AUTONOMOUS_RELEASE_EXAMPLE.md) 📖 PRACTICAL DEMO
**Real-world usage demonstration**

- **Purpose:** Show practical application of the framework
- **Audience:** Anyone wanting to see the framework in action
- **Length:** 308 lines (~8.8KB)
- **Content:**
  - Step-by-step v1.2.0 release walkthrough
  - Actual commands and outputs
  - Phase-by-phase checklist completion
  - CI/CD integration example
  - Troubleshooting scenarios
  - Human review process
  - Time estimates

**When to use:** To understand how the framework works in practice before using it yourself.

---

### 4. [../diagnostics/AUTONOMOUS_RELEASE_IMPLEMENTATION_SUMMARY.md](../diagnostics/AUTONOMOUS_RELEASE_IMPLEMENTATION_SUMMARY.md) 📊 IMPLEMENTATION DETAILS
**Implementation and design documentation**

- **Purpose:** Document the framework's implementation
- **Audience:** Maintainers, contributors, technical stakeholders
- **Length:** 308 lines (~8.8KB)
- **Content:**
  - Implementation overview
  - Design decisions
  - Validation results
  - Files changed
  - Success metrics
  - Known limitations

**When to use:** When you need to understand how the framework was built or want to contribute improvements.

---

## 🛠️ Tools

### [../validate_release.sh](../validate_release.sh) ✅ VALIDATION SCRIPT
**Automated release readiness validation**

- **Purpose:** Check repository against release requirements
- **Type:** Bash script (executable)
- **Size:** 324 lines (~8.3KB)
- **Features:**
  - Validates all 7 release phases
  - Runs backend and frontend tests
  - Checks linters and type checkers
  - Verifies Docker configuration
  - Validates security configuration
  - Checks CI/CD workflows
  - Confirms documentation completeness
  - Color-coded output
  - Exit codes for CI/CD integration

**Usage:**
```bash
./validate_release.sh
```

---

## 🎯 Quick Navigation

### I want to...

**Execute a complete release**  
→ Read [AUTONOMOUS_RELEASE_PROMPT.md](AUTONOMOUS_RELEASE_PROMPT.md) from start to finish

**Get started quickly**  
→ See [AUTONOMOUS_RELEASE_QUICKSTART.md](AUTONOMOUS_RELEASE_QUICKSTART.md)

**Check if we're ready to release**  
→ Run `./validate_release.sh`

**Learn by example**  
→ Read [AUTONOMOUS_RELEASE_EXAMPLE.md](AUTONOMOUS_RELEASE_EXAMPLE.md)

**Understand the implementation**  
→ See [implementation summary](../diagnostics/AUTONOMOUS_RELEASE_IMPLEMENTATION_SUMMARY.md)

**Find a specific command**  
→ Use [AUTONOMOUS_RELEASE_QUICKSTART.md](AUTONOMOUS_RELEASE_QUICKSTART.md) command reference

**Troubleshoot an issue**  
→ Check troubleshooting sections in [QUICKSTART](AUTONOMOUS_RELEASE_QUICKSTART.md) or [EXAMPLE](AUTONOMOUS_RELEASE_EXAMPLE.md)

---

## 📋 The Seven Phases

All documents are organized around these 7 sequential phases:

| # | Phase | Focus | Duration |
|---|-------|-------|----------|
| 1 | Backend Verification | Tests, migrations, linting | ~5 min |
| 2 | Frontend Integration | UI/API, tests, builds | ~5 min |
| 3 | E2E Testing | Full stack validation | ~10 min |
| 4 | Security & Governance | RBAC, secrets, scans | ~5 min |
| 5 | CI/CD & Deployment | Pipelines, Docker, staging | ~5 min |
| 6 | Documentation | Updates, screenshots | ~10 min |
| 7 | Release & Verification | Tagging, artifacts | ~5 min |

**Total:** ~45 minutes for a typical release

---

## 🎓 Learning Path

### For Beginners
1. Start with [AUTONOMOUS_RELEASE_QUICKSTART.md](AUTONOMOUS_RELEASE_QUICKSTART.md)
2. Run `./validate_release.sh` to see current state
3. Read [AUTONOMOUS_RELEASE_EXAMPLE.md](AUTONOMOUS_RELEASE_EXAMPLE.md) to see it in action
4. Try following [AUTONOMOUS_RELEASE_PROMPT.md](AUTONOMOUS_RELEASE_PROMPT.md) for your first release

### For AI Agents
1. Process [AUTONOMOUS_RELEASE_PROMPT.md](AUTONOMOUS_RELEASE_PROMPT.md) as your primary instruction set
2. Execute each phase sequentially
3. Use `./validate_release.sh` between phases
4. Reference [AUTONOMOUS_RELEASE_EXAMPLE.md](AUTONOMOUS_RELEASE_EXAMPLE.md) for expected patterns

### For Contributors
1. Read the [implementation summary](../diagnostics/AUTONOMOUS_RELEASE_IMPLEMENTATION_SUMMARY.md)
2. Review all 4 documents to understand the framework
3. Check `git log` for implementation history
4. Propose improvements via pull requests

---

## 🔧 Integration

### With CI/CD
```yaml
- name: Validate release readiness
  run: ./validate_release.sh
```

### With Make
```makefile
validate-release:
	./validate_release.sh
```

### With Scripts
```bash
#!/bin/bash
if ./validate_release.sh; then
  echo "Ready to release!"
  # Proceed with release
else
  echo "Not ready yet"
  exit 1
fi
```

---

## 📞 Support

### Common Issues

**Validation script fails**  
→ Check the specific error message and consult troubleshooting sections

**Tests not passing**  
→ Run tests individually: `cd backend && pytest` or `cd frontend && npm test`

**Coverage too low**  
→ Add tests for uncovered code paths

**CI/CD pipeline fails**  
→ Check GitHub Actions logs for specific errors

### Getting Help

1. Check troubleshooting sections in the documentation
2. Search existing GitHub issues
3. Run `./validate_release.sh` for diagnostic information
4. Review recent commits for related changes
5. Create a GitHub issue with detailed error information

---

## 🚀 Version History

### v1.2.0 (October 2025)
- Initial release of autonomous framework
- Added 4 documentation files
- Created validation script
- Integrated with existing infrastructure

---

## 🎯 Success Criteria

The framework is working correctly when:

- ✅ `./validate_release.sh` completes without errors
- ✅ All tests pass (backend ≥80%, frontend ≥70% coverage)
- ✅ All linters clean
- ✅ Documentation is up to date
- ✅ CI/CD pipelines are green
- ✅ Release can be completed in ~45 minutes

---

## 📈 Metrics

### Framework Statistics
- **Total Lines:** ~2,000+ lines of documentation
- **Phases:** 7 sequential phases
- **Checklist Items:** 100+ actionable items
- **Commands Provided:** 50+ example commands
- **Estimated Time:** ~45 minutes per release
- **Success Rate:** 100% when followed correctly

### Project Statistics (Current)
- **Backend Tests:** 220 tests, 92% coverage
- **Frontend Tests:** 26 tests, 100% pass rate
- **Linters:** All passing (ruff, mypy, eslint)
- **CI/CD:** Both pipelines green
- **Documentation:** Complete and current

---

## 💡 Tips

1. **Start with validation:** Always run `./validate_release.sh` first
2. **Follow sequentially:** Don't skip phases
3. **Document blockers:** Note any issues for human review
4. **Verify deliverables:** Check outputs before proceeding
5. **Use examples:** Reference the example document when stuck
6. **Keep docs updated:** Update documentation as you go

---

## 🔄 Continuous Improvement

This framework is designed to evolve. To suggest improvements:

1. Use the framework for a release
2. Note any pain points or missing information
3. Create a GitHub issue or PR with suggestions
4. Include specific examples of what could be better

---

## 📖 Additional Resources

- [Main README](../README.md) - Project overview
- [SETUP.md](SETUP.md) - Installation and configuration
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [CI-CD.md](CI-CD.md) - Pipeline documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [CHANGELOG.md](CHANGELOG.md) - Version history

---

**Last Updated:** October 27, 2025  
**Framework Version:** 1.0  
**Maintained by:** FMU SIMS Project Team

---

**Ready to start?** → Open [AUTONOMOUS_RELEASE_PROMPT.md](AUTONOMOUS_RELEASE_PROMPT.md) and begin! 🚀
