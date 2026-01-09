# Syllabus Manager

## Purpose

The Syllabus Manager allows administrators to manage syllabus items attached to the academic hierarchy (Program, Period, Learning Block, or Module).

## API Endpoints

### GET /api/admin/syllabus/

List syllabus items with optional filters:
- `program_id`: Filter by program
- `period_id`: Filter by period
- `learning_block_id`: Filter by learning block
- `module_id`: Filter by module
- `is_active`: Filter by active status
- `title`: Search by title (partial match)

**Permissions**: ADMIN only

### POST /api/admin/syllabus/

Create a new syllabus item.

**Request Body**:
```json
{
  "program": 1,  // Optional, at least one anchor required
  "period": 2,   // Optional
  "learning_block": 3,  // Optional
  "module": 4,   // Optional
  "title": "Introduction to Anatomy",
  "code": "ANAT-101",
  "description": "Basic anatomy concepts",
  "learning_objectives": "Understand human body structure",
  "order_no": 1,
  "is_active": true
}
```

### PATCH /api/admin/syllabus/{id}/

Update a syllabus item.

### DELETE /api/admin/syllabus/{id}/

Delete a syllabus item.

### POST /api/admin/syllabus/reorder/

Bulk reorder syllabus items.

**Request Body**:
```json
{
  "items": [
    {"id": 1, "order_no": 2},
    {"id": 2, "order_no": 1}
  ]
}
```

## Permissions

- **Access**: ADMIN role only
- **Backend Permission Class**: `IsAdmin`
- **Frontend Route Protection**: `ProtectedRoute` with `allowedRoles={['Admin']}`

## UI Route

- **Path**: `/admin/syllabus`
- **Component**: `SyllabusManagerPage`
- **Location**: `frontend/src/pages/admin/SyllabusManagerPage.tsx`

## Features

1. **Hierarchical Filters**: Filter by Program → Period → Learning Block → Module
2. **Syllabus Items Table**: Display all items with order, title, code, anchor, and status
3. **Create/Edit Form**: Modal form for creating or editing syllabus items
4. **Reorder Functionality**: Move items up/down to change order
5. **Validation**: Ensures at least one academic anchor is set

## How to Verify

### Manual Steps

1. **Create a Syllabus Item**:
   ```bash
   curl -X POST http://127.0.0.1:8080/api/admin/syllabus/ \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{
       "program": 1,
       "title": "Test Syllabus",
       "order_no": 1,
       "is_active": true
     }'
   ```

2. **List Syllabus Items**:
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" \
     http://127.0.0.1:8080/api/admin/syllabus/?program_id=1
   ```

3. **Reorder Items**:
   ```bash
   curl -X POST http://127.0.0.1:8080/api/admin/syllabus/reorder/ \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"items": [{"id": 1, "order_no": 2}, {"id": 2, "order_no": 1}]}'
   ```

4. **Verify Frontend**:
   - Navigate to `/admin/syllabus`
   - Test filters (Program → Period → Block → Module)
   - Create a new syllabus item
   - Edit an existing item
   - Test reorder (move up/down buttons)
   - Delete an item

### Automated Tests

```bash
# Backend tests
cd backend
pytest sims_backend/syllabus/tests.py -v
```

## Known Limitations

- Reorder only works within the same anchor context (same program/period/block/module)
- Module selection requires learning block to be selected first
- No CSV import/export implemented yet (optional feature)

## Implementation Details

- **Backend Model**: `sims_backend/syllabus/models.py::SyllabusItem`
- **Backend ViewSet**: `sims_backend/syllabus/views.py::SyllabusItemViewSet`
- **Frontend**: `frontend/src/pages/admin/SyllabusManagerPage.tsx`
- **API Client**: `frontend/src/api/syllabus.ts`
