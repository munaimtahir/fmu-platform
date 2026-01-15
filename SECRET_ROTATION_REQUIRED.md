# 🔐 SECRET ROTATION REQUIRED - CRITICAL

## ⚠️ SECURITY ALERT

All secrets previously committed to this repository have been **PURGED from git history** as part of Phase B-S: Security-Only Surgical Cleanup.

However, **these secrets are considered COMPROMISED** and **MUST BE ROTATED IMMEDIATELY**.

---

## 🔄 Secrets That MUST Be Rotated

### 1. Django Secret Key
- **Variable:** `DJANGO_SECRET_KEY`
- **Location:** Backend Django settings
- **Action Required:** Generate new secret key and update in:
  - Production environment variables
  - Deployment configuration
  - Secret management system

**Generate new key:**
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### 2. Database Password
- **Variables:** 
  - `DB_PASSWORD`
  - `POSTGRES_PASSWORD`
- **Location:** PostgreSQL database
- **Action Required:**
  1. Generate new secure password
  2. Update database user password
  3. Update environment variables
  4. Restart all services

**Generate new password:**
```bash
openssl rand -base64 32
```

### 3. JWT Signing Keys
- **Action Required:** If using separate JWT signing keys, rotate them
- **Impact:** All existing JWT tokens will be invalidated

### 4. Third-Party API Keys
- **Action Required:** Check for any third-party API keys and rotate them
- **Examples:**
  - Email service credentials
  - External API integrations
  - Payment gateway keys

---

## 📋 Rotation Checklist

- [ ] Generate new `DJANGO_SECRET_KEY`
- [ ] Generate new `DB_PASSWORD` and `POSTGRES_PASSWORD`
- [ ] Update production environment variables
- [ ] Update deployment configurations
- [ ] Update secret management system (Vault, AWS Secrets Manager, etc.)
- [ ] Rotate JWT signing keys (if separate)
- [ ] Rotate third-party API keys
- [ ] Update `.env` files in all environments (DO NOT COMMIT)
- [ ] Test application with new credentials
- [ ] Notify team about credential rotation
- [ ] Monitor for any authentication failures

---

## ⚠️ CRITICAL NOTES

1. **NEVER commit real secrets to git** - Only use `.env.example` with placeholder values
2. **All .env files are now gitignored** - This includes `.env`, `.env.*`, `.env.backup`
3. **Database dumps are gitignored** - Files like `*.dump`, `*.sql`, `*.bak`, `*.backup`
4. **Credential files are gitignored** - Files matching `*credentials*.md`, `*password*.txt`, etc.

---

## 📚 Reference

For secure secret generation:
```bash
# Django secret key
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Random password (32 bytes)
openssl rand -base64 32

# Random password (64 bytes)
openssl rand -base64 64
```

---

## 🔍 Verification

After rotation, verify:
1. Application starts successfully
2. Database connections work
3. Authentication works
4. No old credentials remain in any environment

---

**Date:** 2026-01-15  
**Phase:** B-S: Security-Only Surgical Cleanup  
**Status:** ROTATION REQUIRED
