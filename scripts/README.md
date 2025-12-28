# Scripts Directory

This directory contains utility scripts for testing, validation, and deployment of the FMU SIMS application.

## Available Scripts

### Quick Start
- **`quick-start.sh`** - Quick setup and start script for the application

### Testing Scripts
- **`test_api_endpoints.sh`** - Test backend API endpoints
- **`test_integration.sh`** - Run integration tests

### Validation Scripts
- **`validate_completion.sh`** - Validate project completion criteria
- **`validate_docker_deployment.sh`** - Validate Docker deployment
- **`validate_release.sh`** - Comprehensive release validation
  - Validates backend tests and coverage (≥80%)
  - Validates frontend tests and coverage (≥70%)
  - Runs code quality checks (linters, type checking)
  - Checks Docker configuration
  - Verifies security configuration
  - Validates CI/CD workflows
  - Checks documentation completeness
- **`validate_stage4.sh`** - Validate Stage 4 completion

### Maintenance Scripts
- **`restore.sh`** - Restore application from backup

## Usage

All scripts should be run from the project root directory:

```bash
# Make scripts executable (if needed)
chmod +x scripts/*.sh

# Run a script
./scripts/validate_release.sh
```

## Note

Most of these scripts are for development and testing purposes. For production deployment, use the docker-compose configurations and Makefile commands instead.

See the main [README.md](../README.md) for standard deployment procedures.
