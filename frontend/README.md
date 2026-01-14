# SIMS Frontend - React + TypeScript + Vite

Student Information Management System - Frontend Application

> 📖 **New**: See [INTEGRATION.md](./INTEGRATION.md) for quick start guide on the newly integrated CRUD modules

## 🎯 Stage-2 Complete: Core UI Layer + CRUD Integration ✅

This is a production-ready Stage-2 MVP featuring:
- ✅ Full JWT authentication with token refresh
- ✅ **Collapsible sidebar with role-aware navigation**
- ✅ **Enhanced topbar with user menu and search**
- ✅ **Breadcrumb navigation**
- ✅ **DataTable component with TanStack Table**
- ✅ **Comprehensive Form Kit (Select, DatePicker, FileUpload, Switch, TextArea)**
- ✅ **Role-specific dashboards (Admin, Registrar, Faculty, Student, ExamCell)**
- ✅ **Complete CRUD modules (Students, Courses, Sections, Assessments)** 🆕
- ✅ **Type-safe API service layer with React Query** 🆕
- ✅ **Form validation with Zod schemas** 🆕
- ✅ TypeScript strict mode with comprehensive type safety
- ✅ Minimalist-Elite design system
- ✅ Protected routes and role-based authorization
- ✅ Comprehensive test coverage (26 tests passing)
- ✅ **CI/CD workflow with automated testing**
- ✅ Production build optimized and ready

## Tech Stack

- **React 19** - Latest React with concurrent features
- **TypeScript** - Strict mode enabled for maximum type safety
- **Vite 7** - Lightning-fast build tool and dev server
- **Tailwind CSS 3** - Utility-first CSS framework
- **React Router v6** - Client-side routing with protected routes
- **Axios** - HTTP client with request/response interceptors
- **React Query** - Server state management
- **Zustand** - Lightweight state management for auth
- **React Hook Form + Zod** - Form validation with type-safe schemas
- **Vitest** - Fast unit testing framework
- **ESLint** - Code quality and consistency

## Setup for Development

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000` (or configure via `.env.local`)

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
# Create .env.local file
cp .env.example .env.local

# Edit .env.local and set:
VITE_API_BASE_URL=http://localhost:8000
```

3. **Run the development server:**
```bash
npm run dev
```

The application will be available at http://localhost:5173

### Docker Development

See the main README and docker-compose.yml in the root directory.

## Available Scripts

- `npm run dev` - Start development server (with HMR)
- `npm run build` - Build for production (includes type-checking)
- `npm run type-check` - Run TypeScript type checking without building
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality
- `npm run test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode

## Project Structure

```
frontend/
├── src/
│   ├── api/                    # API clients and HTTP layer
│   │   ├── axios.ts           # Axios instance with interceptors
│   │   └── auth.ts            # Authentication API methods
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Alert.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── FormField.tsx
│   │   │   ├── Select.tsx          # NEW: Searchable select
│   │   │   ├── DatePicker.tsx      # NEW: Date/range picker
│   │   │   ├── FileUpload.tsx      # NEW: Drag-drop upload
│   │   │   ├── Switch.tsx          # NEW: Toggle switch
│   │   │   ├── TextArea.tsx        # NEW: Text area with counter
│   │   │   ├── EmptyState.tsx      # NEW: Empty state component
│   │   │   ├── Skeleton.tsx        # NEW: Loading skeletons
│   │   │   └── DataTable/          # NEW: Data table
│   │   │       ├── DataTable.tsx
│   │   │       ├── types.ts
│   │   │       └── useDataTable.ts
│   │   ├── layout/            # NEW: Layout components
│   │   │   ├── Sidebar.tsx         # Collapsible sidebar
│   │   │   ├── Topbar.tsx          # Top navigation bar
│   │   │   └── Breadcrumbs.tsx     # Breadcrumb navigation
│   │   └── layouts/           # Page layouts
│   │       ├── AuthLayout.tsx
│   │       └── DashboardLayout.tsx # Updated with new layout
│   ├── features/              # Feature-based modules
│   │   └── auth/
│   │       ├── types.ts       # Auth type definitions
│   │       ├── authStore.ts   # Zustand auth state
│   │       ├── useAuth.ts     # Auth hook
│   │       ├── LoginPage.tsx  # Login page component
│   │       └── ProtectedRoute.tsx  # Updated: role-based guards
│   ├── pages/                 # Page components
│   │   ├── DashboardHome.tsx  # Updated: role-based redirect
│   │   ├── dashboards/        # NEW: Role dashboards
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── RegistrarDashboard.tsx
│   │   │   ├── FacultyDashboard.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   └── ExamCellDashboard.tsx
│   │   └── demo/              # NEW: Demo pages
│   │       └── DataTableDemo.tsx
│   ├── routes/                # Routing configuration
│   │   ├── index.tsx
│   │   └── appRoutes.tsx      # Updated: role routes
│   ├── lib/                   # Shared utilities
│   │   └── env.ts             # NEW: Environment config
│   ├── styles/
│   │   └── globals.css       # Global styles and Tailwind
│   ├── test/                 # Test utilities
│   │   └── setup.ts
│   ├── App.tsx               # Root application component
│   ├── main.tsx              # Application entry point
│   └── vite-env.d.ts         # Vite type definitions
├── public/                    # Static assets
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── eslint.config.js           # ESLint configuration
```

## Authentication Flow

### Login Process

1. User enters credentials on `/login` page
2. Form validates inputs using Zod schema
3. On submit, credentials are sent to `/api/auth/login/` with `{ identifier, password }`
4. Backend returns `{ user, tokens: { access, refresh } }`
5. Tokens are stored in localStorage
6. Auth state is initialized from token
7. User is redirected to `/dashboard`

### Token Refresh (Single-Flight Pattern)

The application implements a sophisticated single-flight token refresh pattern:

1. **Access token** is attached to all API requests via Axios interceptor
2. When a request receives **401 Unauthorized**:
   - If refresh is already in progress, the request is queued
   - Otherwise, a refresh is initiated using the refresh token
3. On successful refresh:
   - New access token is stored
   - All queued requests are replayed with new token
4. On refresh failure:
   - Tokens are cleared
   - User is redirected to login
   - All queued requests are rejected

This ensures:
- Only one refresh request at a time
- No race conditions
- Seamless user experience
- Efficient token management

### Protected Routes

Routes wrapped with `<ProtectedRoute>` component:
- Check authentication state
- Display loading spinner during initialization
- Redirect to `/login` if not authenticated
- **NEW**: Check role-based authorization
- **NEW**: Redirect to main dashboard if user lacks required role
- Render protected content if authorized

Example:
```tsx
<ProtectedRoute allowedRoles={['Admin', 'Registrar']}>
  <StudentManagementPage />
</ProtectedRoute>
```

### Role-Based Redirect

The main dashboard (`/dashboard`) automatically redirects users to their role-specific dashboard:
- **Admin** → `/dashboard/admin`
- **Registrar** → `/dashboard/registrar`
- **Faculty** → `/dashboard/faculty`
- **Student** → `/dashboard/student`
- **ExamCell** → `/dashboard/examcell`

Priority order: Admin > Registrar > Faculty > Student > ExamCell

### Logout

1. User clicks logout button
2. Tokens are cleared from localStorage
3. Auth state is reset
4. React Query cache is invalidated
5. User is redirected to `/login`

## Design System - Minimalist-Elite

The UI follows a Minimalist-Elite aesthetic:

### Colors
- **Primary Blue**: `#3B82F6` - Primary actions and links
- **Emerald Green**: `#10B981` - Success states
- **Gray Scale**: Tailwind's default gray palette
- **Background**: `gray-50` (#F9FAFB)
- **Text**: `gray-900` (#111827)

### Typography
- **Font**: Inter (system fallback)
- **Weights**: 400 (normal), 600 (semibold)
- **Generous whitespace** for breathing room

### Components
- **Rounded corners**: `rounded-2xl` (1rem)
- **Transitions**: 150ms ease-in-out
- **Shadow**: Subtle elevation with `shadow-md` and `shadow-xl`
- **Focus states**: Blue ring on interactive elements

### Accessibility
- WCAG AA compliant color contrast
- Keyboard navigation fully supported
- ARIA labels on all interactive elements
- Screen reader friendly
- Focus visible indicators

## Environment Variables

Create a `.env.local` file for local development:

```env
VITE_API_BASE_URL=http://localhost:8000
```

**Note**: Environment variables must be prefixed with `VITE_` to be exposed to the client.

## Testing

The project uses Vitest with Testing Library for comprehensive test coverage:

### Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

Current coverage includes:
- ✅ Authentication flow (login, logout, token refresh)
- ✅ Protected route guards
- ✅ UI components (Button, Input, etc.)
- ✅ Form validation
- ✅ API interceptors and token management

### Writing Tests

Tests are colocated with components using `.test.tsx` or `.test.ts` extensions.

Example:
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

test('renders button', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

## Building for Production

```bash
npm run build
```

This will:
1. Run TypeScript type checking
2. Build optimized production bundles
3. Output to `dist/` directory

The built files include:
- Minified JavaScript bundles with code splitting
- Optimized CSS with Tailwind purge
- Asset optimization and fingerprinting

### Preview Production Build

```bash
npm run preview
```

## Code Quality

### Continuous Integration

GitHub Actions CI workflow runs on every PR and push:
- ✅ **Type checking** - TypeScript strict mode
- ✅ **Linting** - ESLint code quality checks
- ✅ **Testing** - All unit tests must pass
- ✅ **Building** - Production build verification

The CI workflow is defined in `.github/workflows/ci.yml` and automatically runs for:
- Pull requests to `main` or `master`
- Pushes to `main`, `master`, `feat/*`, `stage/*` branches

### Type Safety

- **Strict TypeScript mode** enabled
- **No implicit any** - all types must be explicit
- **Path aliases** configured (`@/*` for `src/*`)
- **Type checking** runs during build

### Linting

ESLint is configured with:
- React hooks rules
- React refresh rules
- Modern JavaScript/TypeScript rules

```bash
npm run lint
```

## Performance

### Lighthouse Scores (Production Build)

The application meets Stage-1 performance requirements:
- ⚡ Performance: 90+
- ♿ Accessibility: 90+
- 🎯 Best Practices: 90+
- 🔍 SEO: 85+

### Optimizations

- Code splitting by route
- Lazy loading for better initial load
- Tailwind CSS purging unused styles
- Modern JavaScript features (ES2020+)
- React 19 concurrent features

## Stage-2 Roadmap

The foundation is ready for Stage-2 features:
- Student management (CRUD operations)
- Course management
- Enrollment workflows
- Role-based access control (Admin, Registrar, Faculty, Student)
- Advanced filtering and search
- Data tables with pagination

## 🧩 Navigation & Layout (Stage-2)

### Sidebar Navigation

The application features a collapsible sidebar with:
- **Role-aware menu items** - Items shown based on user roles
- **Persistent state** - Collapse state saved to localStorage
- **Mobile responsive** - Drawer on mobile, fixed on desktop
- **Keyboard accessible** - Full keyboard navigation support

```tsx
// Sidebar automatically filters items by role
const navigationItems = [
  { label: 'Students', roles: ['Admin', 'Registrar'] },
  { label: 'Courses', roles: ['Admin', 'Registrar', 'Faculty'] },
  // ... more items
]
```

### Breadcrumbs

Automatic breadcrumb generation from route paths:
- `/dashboard/student` → Home > Dashboard > Student
- Customizable labels via `routeLabels` mapping
- Click any breadcrumb to navigate

### Topbar

Features:
- **User menu** with profile info and logout
- **Global search** (placeholder for future implementation)
- **Notifications** (placeholder for future implementation)
- **Responsive design** for mobile and desktop

## 📊 DataTable Component (Stage-2)

A powerful, reusable data table built with TanStack Table:

### Features

- ✅ **Sorting** - Click column headers to sort
- ✅ **Global filtering** - Search across all columns
- ✅ **Pagination** - Navigate through pages
- ✅ **CSV Export** - Export all or selected rows
- ✅ **Row selection** - Multi-select with checkboxes
- ✅ **Column visibility** - Show/hide columns
- ✅ **Loading states** - Skeleton loaders
- ✅ **Empty states** - Friendly empty state UI
- ✅ **Responsive** - Works on all screen sizes

### Basic Usage

```tsx
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { ColumnDef } from '@tanstack/react-table'

interface Student {
  id: string
  name: string
  email: string
  gpa: number
}

const columns: ColumnDef<Student>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'gpa',
    header: 'GPA',
    cell: ({ row }) => row.getValue('gpa').toFixed(2),
  },
]

function StudentList() {
  const students = // ... fetch data
  
  return (
    <DataTable
      data={students}
      columns={columns}
      enableSorting
      enableFiltering
      enablePagination
      pageSize={10}
    />
  )
}
```

### Advanced Features

```tsx
<DataTable
  data={students}
  columns={columns}
  enableSorting
  enableFiltering
  enablePagination
  enableRowSelection      // Enable row selection
  enableColumnVisibility  // Enable column toggle
  pageSize={20}          // Custom page size
  onRowClick={(row) => {
    // Handle row click
    navigate(`/students/${row.id}`)
  }}
  isLoading={isLoading}  // Show loading skeleton
/>
```

### Demo

Visit `/demo/datatable` in the application to see an interactive demo with:
- Sample student data
- All features enabled
- Usage examples and code snippets

## 📝 Form Components (Stage-2)

### Select (Searchable Dropdown)

```tsx
import { Select } from '@/components/ui/Select'

<Select
  label="Program"
  options={[
    { value: 'cs', label: 'Computer Science' },
    { value: 'eng', label: 'Engineering' },
  ]}
  value={program}
  onChange={setProgram}
  searchable
  required
/>
```

### DatePicker

```tsx
import { DatePicker, DateRangePicker } from '@/components/ui/DatePicker'

// Single date
<DatePicker
  label="Birth Date"
  value={birthDate}
  onChange={setBirthDate}
  required
/>

// Date range
<DateRangePicker
  label="Enrollment Period"
  startDate={startDate}
  endDate={endDate}
  onStartChange={setStartDate}
  onEndChange={setEndDate}
/>
```

### FileUpload (Drag & Drop)

```tsx
import { FileUpload } from '@/components/ui/FileUpload'

<FileUpload
  label="Upload Documents"
  onChange={(files) => setFiles(files)}
  accept=".pdf,.doc,.docx"
  multiple
  maxSize={5 * 1024 * 1024} // 5MB
/>
```

### Switch

```tsx
import { Switch } from '@/components/ui/Switch'

<Switch
  label="Email Notifications"
  checked={emailNotifications}
  onChange={setEmailNotifications}
  description="Receive email updates"
/>
```

### TextArea

```tsx
import { TextArea } from '@/components/ui/TextArea'

<TextArea
  label="Comments"
  value={comments}
  onChange={(e) => setComments(e.target.value)}
  showCharCount
  maxLength={500}
  rows={5}
/>
```

### Integration with React Hook Form

All form components work seamlessly with React Hook Form:

```tsx
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  program: z.string().min(1, 'Program is required'),
  birthDate: z.date(),
})

function StudentForm() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="program"
        control={control}
        render={({ field, fieldState }) => (
          <Select
            {...field}
            label="Program"
            options={programOptions}
            error={fieldState.error?.message}
          />
        )}
      />
    </form>
  )
}
```

## Troubleshooting

### "Cannot find module" errors

Ensure all dependencies are installed:
```bash
rm -rf node_modules package-lock.json
npm install
```

### API connection errors

1. Check that backend is running on correct port
2. Verify `VITE_API_BASE_URL` in `.env.local`
3. Check browser console for CORS errors

### Build fails with type errors

Run type checking to see detailed errors:
```bash
npm run type-check
```

## Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Run `npm run lint` and `npm run type-check` before committing
4. Keep components small and focused
5. Document complex logic with comments

## License

See the main LICENSE file in the repository root.
