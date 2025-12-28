# FMU SIMS - Demo Showcase Guide

## Quick Demo Setup

```bash
# One-command setup (copy and run)
git clone https://github.com/munaimtahir/Fmu.git && cd Fmu && cp .env.example .env && docker compose up -d && sleep 10 && docker compose exec backend python manage.py migrate && docker compose exec backend python manage.py seed_demo --students 30
```

**Access:** http://localhost:5173

## Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Registrar | registrar | registrar123 |
| Faculty | faculty | faculty123 |
| Student | student | student123 |

## 15-Minute Demo Flow

### 1. Admin Demo (4 min)
**Login:** admin / admin123
- Dashboard with real-time stats
- User management & roles
- System configuration

### 2. Faculty Demo (4 min)
**Login:** faculty / faculty123
- My sections (filtered view)
- Attendance tracking
- Grading & results

### 3. Student Demo (3 min)
**Login:** student / student123
- Personal dashboard
- Attendance & results
- Document requests

### 4. Technical (2 min)
- API docs: http://localhost:8000/api/docs/
- Security features
- Role-based permissions

### 5. Q&A (2 min)

## Key Features to Highlight

- ✅ Role-based access control
- ✅ Real-time dashboard statistics  
- ✅ Attendance tracking with alerts
- ✅ Grade calculation & approval workflow
- ✅ Student self-service portal
- ✅ Production-ready architecture

## Troubleshooting

```bash
# Restart if needed
docker compose down && docker compose up -d

# Re-seed data
docker compose exec backend python manage.py seed_demo --clear --students 30
```

## Resources

- **Full Guide:** See complete SHOWCASE.md for detailed walkthrough
- **Docs:** [Documentation](../Docs/)
- **API:** http://localhost:8000/api/docs/
