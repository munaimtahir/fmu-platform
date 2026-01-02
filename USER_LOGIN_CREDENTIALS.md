# User Login Credentials

**Date:** January 2, 2026  
**Status:** ✅ **All users created and passwords set**

---

## Login Credentials

### Administrative Users

| Role | Username | Password | Access |
|------|----------|----------|--------|
| **Admin** | `admin` | `admin123` | Full system access, Django admin panel |
| **Registrar** | `registrar` | `registrar123` | Student enrollment, academic management |
| **Finance** | `finance` | `finance123` | Fee management, vouchers, payments |

### Faculty Users

All faculty users use the password: `faculty123`

| Username | Email | Access |
|----------|-------|--------|
| `faculty` | faculty@sims.edu | Attendance, assessments |
| `faculty1` | faculty1@sims.edu | Attendance, assessments |
| `faculty2` | faculty2@sims.edu | Attendance, assessments |
| `faculty3` | faculty3@sims.edu | Attendance, assessments |

### Student Users

| Username | Email | Password | Access |
|----------|-------|----------|--------|
| `student` | student@sims.edu | `student123` | Student dashboard, own profile |

---

## Login URLs

- **Frontend Login:** https://sims.alshifalab.pk/login
- **Django Admin:** https://sims.alshifalab.pk/admin/
- **API:** https://sims.alshifalab.pk/api/

---

## Verification

All users have been tested and can successfully authenticate:

✅ Admin - Login works  
✅ Registrar - Login works  
✅ Finance - Login works  
✅ Faculty (all 4) - Login works  
✅ Student - Login works  

---

## ⚠️ Security Note

**IMPORTANT:** These are demo passwords for testing. **Change all passwords immediately before production use!**

### How to Change Passwords

**Via Django Admin:**
1. Login to https://sims.alshifalab.pk/admin/
2. Navigate to Authentication and Authorization → Users
3. Select user and change password

**Via Django Shell:**
```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py changepassword <username>
```

**Via Python:**
```python
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.get(username='admin')
user.set_password('new_secure_password')
user.save()
```

---

## Troubleshooting

### If login doesn't work:

1. **Check user exists:**
   ```bash
   docker compose -f docker-compose.prod.yml exec backend python manage.py shell
   >>> from django.contrib.auth import get_user_model
   >>> User = get_user_model()
   >>> User.objects.filter(username='admin').exists()
   ```

2. **Reset password:**
   ```bash
   docker compose -f docker-compose.prod.yml exec backend python manage.py changepassword admin
   ```

3. **Check user is active:**
   ```python
   user = User.objects.get(username='admin')
   print(f"Active: {user.is_active}, Staff: {user.is_staff}")
   ```

4. **Test authentication:**
   ```python
   from django.contrib.auth import authenticate
   user = authenticate(username='admin', password='admin123')
   print(f"Authenticated: {user is not None}")
   ```

---

**Last Updated:** January 2, 2026
