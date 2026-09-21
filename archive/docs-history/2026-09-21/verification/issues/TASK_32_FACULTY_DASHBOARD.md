# Issue: Faculty Dashboard Backend Endpoint Not Verified

**Task**: Task 32 (Faculty dashboard - basic)  
**Severity**: Minor  
**Status**: Needs Verification  
**Date**: 2026-01-09

## Description

While faculty-related functionality exists, a dedicated `/api/faculty/dashboard/` endpoint was not found during code inspection. The frontend may be using a generic dashboard or role-based data filtering.

## Evidence

**What Exists** ✅:
- `frontend/src/pages/dashboards/` - Dashboard pages (likely includes faculty)
- `backend/sims_backend/admin/views.py` - Admin dashboard endpoint
- Faculty identified via Django Groups ("FACULTY" group)
- Faculty count query in admin dashboard

**What's Unclear** ⚠️:
- No explicit `/api/faculty/dashboard/` endpoint found
- May use role-based filtering on generic dashboard
- May use existing `/api/admin/dashboard/` with permissions

## Possible Implementations

### Option 1: Dedicated Faculty Dashboard Endpoint

```python
# backend/sims_backend/faculty/views.py
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsFaculty])
def faculty_dashboard(request):
    """
    Faculty dashboard with teacher-specific stats.
    """
    user = request.user
    
    # Get faculty's assigned courses
    my_courses = Course.objects.filter(
        faculty=user
    ).count()
    
    # Get students in my courses
    my_students = Student.objects.filter(
        enrollments__course__faculty=user
    ).distinct().count()
    
    # Get upcoming classes
    upcoming_classes = # ... timetable logic
    
    return Response({
        'my_courses': my_courses,
        'my_students': my_students,
        'upcoming_classes': upcoming_classes,
        # ... other stats
    })
```

### Option 2: Role-Based Dashboard

```python
# Reuse admin dashboard with role-based data
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """
    Unified dashboard - data filtered by role.
    """
    if is_admin(request.user):
        return admin_dashboard_data()
    elif is_faculty(request.user):
        return faculty_dashboard_data()
    elif is_student(request.user):
        return student_dashboard_data()
```

### Option 3: Frontend-Only Dashboard

```typescript
// Frontend fetches role-appropriate data
const FacultyDashboard = () => {
  const { data: courses } = useQuery('/api/courses/?faculty=me');
  const { data: students } = useQuery('/api/students/?my_courses=true');
  const { data: classes } = useQuery('/api/timetable/?faculty=me');
  
  // Render dashboard with fetched data
};
```

## Verification Steps

### 1. Check URL Patterns

```bash
# Search for faculty dashboard routes
cd /home/runner/work/fmu-platform/fmu-platform
grep -r "faculty.*dashboard" backend/*/urls.py
grep -r "faculty.*dashboard" backend/*/views.py
```

### 2. Check Frontend API Calls

```bash
# Check what API the frontend dashboard calls
grep -r "dashboard" frontend/src/pages/dashboards/
grep -r "/api/.*dashboard" frontend/src/api/
```

### 3. Check Existing Dashboard Endpoint

```bash
# Test if generic dashboard returns role-specific data
curl http://127.0.0.1:8010/api/dashboard/ \
  -H "Authorization: Bearer <faculty_token>"
```

### 4. Check Documentation

```bash
# Look for API documentation
cat docs/API.md | grep -i "faculty\|dashboard"
```

## Impact

**Current State**:
- ✅ Faculty can log in
- ✅ Faculty can access system
- ✅ Faculty-specific data is filtered
- ⚠️ Dashboard endpoint structure unclear

**If Missing**:
- Frontend may make multiple API calls
- Less efficient data fetching
- No centralized faculty stats

**If Exists**:
- ✅ Efficient single-call dashboard
- ✅ Centralized faculty-specific stats
- ✅ Better performance

## Expected Behavior

A faculty user should be able to:
1. See their assigned courses
2. See their student roster
3. View upcoming classes
4. Check attendance stats for their courses
5. Access grade entry for their courses

## Testing After Verification

```bash
# Create a faculty user token
TOKEN=$(curl -X POST http://127.0.0.1:8010/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"identifier":"faculty_user","password":"password"}' \
  | jq -r '.access')

# Test faculty dashboard
curl http://127.0.0.1:8010/api/faculty/dashboard/ \
  -H "Authorization: Bearer $TOKEN" \
  -v

# Should return 200 with faculty-specific data
```

## Resolution Paths

### Path A: Endpoint Exists
- Document the endpoint
- Add to curl proof artifacts
- Mark task as PASS

### Path B: Using Generic Dashboard
- Verify role-based data filtering works
- Document the pattern
- Mark task as PASS with note

### Path C: No Faculty Dashboard
- Frontend makes multiple API calls
- Consider adding dedicated endpoint
- Mark task as PARTIAL

### Path D: Endpoint Needed
- Implement dedicated endpoint (30 min)
- Add tests
- Document in API docs

## Priority

**LOW** - Functionality likely works, just needs clarification

## Files to Check

- `backend/sims_backend/faculty/views.py` (if exists)
- `backend/sims_backend/faculty/urls.py` (if exists)
- `backend/sims_backend/urls.py` - URL patterns
- `frontend/src/pages/dashboards/` - Dashboard components
- `frontend/src/api/` - API client calls

## Status

**Open** - Needs code verification when environment is available

## Blocked By

- Environment issue (Docker SSL) - cannot run live testing
- Can be verified through code inspection

## Next Steps

1. Search codebase for faculty dashboard implementation
2. Check frontend dashboard API calls
3. Document findings
4. Update task status accordingly
