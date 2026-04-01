# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PortonCare is an Angular 19 Progressive Web Application for managing holiday parks, campgrounds, and rental properties. It handles reservations, housekeeping tasks, staff scheduling, facility maintenance, and includes an interactive 3D map with Mapbox and Three.js.

**Tech Stack:** Angular 19 (standalone components), Supabase (PostgreSQL + Realtime), Firebase (Auth + FCM), PrimeNG UI, Mapbox GL, Three.js, TailwindCSS

## Project Structure

```
porton/
├── src/
│   ├── app/
│   │   ├── core/                          # Business logic & infrastructure
│   │   │   ├── guards/                    # Route guards (auth, role, teams)
│   │   │   ├── models/                    # TypeScript interfaces & enums
│   │   │   │   └── data.models.ts         # All data model definitions
│   │   │   └── services/                  # Core services (~16 services)
│   │   │       ├── auth.service.ts        # Authentication & session management
│   │   │       ├── data.service.ts        # Central state management (BehaviorSubjects)
│   │   │       ├── supabase.service.ts    # Database client wrapper
│   │   │       ├── task.service.ts        # Task operations
│   │   │       ├── house.service.ts       # House/property management
│   │   │       ├── work-group.service.ts  # Team management
│   │   │       ├── work-schedule.service.ts
│   │   │       ├── profile.service.ts
│   │   │       ├── push-notifications.service.ts
│   │   │       ├── device.service.ts
│   │   │       ├── notes.service.ts
│   │   │       ├── statistics.service.ts
│   │   │       ├── season.service.ts
│   │   │       ├── language.service.ts
│   │   │       ├── storage.service.ts
│   │   │       └── export-reservations.service.ts
│   │   │
│   │   ├── pages/                         # Page components (standalone)
│   │   │   ├── home/                      # Dashboard with pinned charts
│   │   │   ├── auth/                      # Login page
│   │   │   ├── reservations/              # Reservation calendar
│   │   │   ├── daily-sheet/               # Daily task assignments
│   │   │   ├── teams/                     # Work group management
│   │   │   ├── map/                       # 3D interactive facility map
│   │   │   ├── work-schedule/             # Staff scheduling calendar
│   │   │   ├── task-archive/              # Historical task tracking
│   │   │   ├── arrivals-and-departures/   # Guest arrival/departure tracking
│   │   │   ├── statistics/                # Analytics & charts
│   │   │   ├── notes/                     # Internal notes/communications
│   │   │   ├── console-messages/          # Admin messages
│   │   │   ├── content-management/        # CMS for houses, profiles, roles
│   │   │   ├── houses/                    # House inventory management
│   │   │   ├── profiles/                  # User profile management
│   │   │   ├── seasons/                   # Seasonal year management
│   │   │   ├── profile-details/           # User profile details
│   │   │   ├── privacy-policy/            # Privacy policy page
│   │   │   └── documentation/             # App documentation
│   │   │
│   │   ├── layout/                        # App shell & navigation
│   │   │   ├── components/                # Layout components (sidebar, topbar)
│   │   │   │   └── app-layout.component.ts
│   │   │   └── services/                  # Layout state management
│   │   │       └── layout.service.ts
│   │   │
│   │   ├── shared/                        # Reusable utilities
│   │   │   ├── rxjs-operators/            # Custom RxJS operators (nonNull)
│   │   │   ├── pipes/                     # Custom Angular pipes
│   │   │   ├── utils/                     # Utility functions
│   │   │   └── debug-overlay/             # Dev tools & i18n loader
│   │   │
│   │   └── firebase/                      # Firebase initialization
│   │       └── firebase.init.ts
│   │
│   ├── environments/                      # Environment configurations
│   │   ├── environment.ts                 # Local dev (Supabase local)
│   │   └── environment.test.ts            # Test environment
│   │
│   ├── assets/
│   │   ├── icons/                         # PWA icons
│   │   ├── models/                        # 3D models (.glb files)
│   │   └── i18n/                          # Translation files
│   │       ├── en.json                    # English translations
│   │       └── hr.json                    # Croatian translations
│   │
│   ├── app.component.ts                   # Root component
│   ├── app.config.ts                      # Angular providers configuration
│   ├── app.routes.ts                      # Route definitions with role guards
│   ├── main.ts                            # Bootstrap entry point
│   ├── styles.scss                        # Global styles
│   ├── index.html                         # HTML entry point
│   ├── manifest.webmanifest               # PWA manifest
│   └── firebase-messaging-sw.js           # FCM service worker
│
├── supabase/
│   ├── migrations/                        # Database migrations (100+ files)
│   ├── functions/                         # Edge functions
│   │   └── user-role/                     # JWT validation & role checking
│   ├── config.toml                        # Supabase local configuration
│   └── seed.sql                           # Database seed data
│
├── angular.json                           # Angular CLI configuration
├── package.json                           # NPM dependencies & scripts
├── tsconfig.json                          # TypeScript configuration
├── tailwind.config.js                     # TailwindCSS configuration
├── firebase.json                          # Firebase hosting config
├── firestore.indexes.json                 # Firestore indexes
├── ngsw-config.json                       # Service worker configuration
├── vercel.json                            # Vercel deployment config
├── .prettierrc.json                       # Prettier formatting rules
├── import-reservations.js                 # Reservation import utility
├── README.md                              # Project documentation
└── CLAUDE.md                              # This file
```

## Development Commands

```bash
# Start development server (port 4200)
ng serve

# Build for production
ng build --configuration production

# Run unit tests
ng test

# Lint code
npm run lint

# Format code with Prettier
npm run format

# Start local Supabase (Docker required)
supabase start

# Stop local Supabase
supabase stop

# Reset local database with migrations
supabase db reset

# Import reservations (utility script)
npm run import-reservations
```

### Supabase Local Development

- Local Supabase runs on `http://127.0.0.1:54321`
- Studio dashboard: `http://127.0.0.1:54323`
- Migrations are in `supabase/migrations/`
- Run `supabase db reset` to apply all migrations to a fresh database
- Database uses custom `porton` schema (NOT `public` schema)

## Architecture

### State Management Pattern

The application uses a **centralized reactive state architecture** with RxJS:

- **DataService** (`src/app/core/services/data.service.ts`) is the central state store using BehaviorSubjects
- All data entities (tasks, houses, reservations, work groups, etc.) are loaded once on app initialization via `loadInitialData()`
- Components subscribe to observables (`tasks$`, `houses$`, etc.) and never make direct database calls
- Updates flow: Component → Specialized Service → Supabase → Realtime Subscription → DataService → All Subscribed Components

**Example flow:**
1. Component calls `taskService.updateTask()`
2. TaskService updates Supabase database
3. Supabase realtime emits change event
4. DataService receives update via `listenToDatabaseChanges()`
5. DataService updates BehaviorSubject
6. All components subscribed to `tasks$` automatically receive updated data

### Real-time Subscriptions

DataService subscribes to Postgres changes for:
- `house_availabilities` (reservations)
- `temp_house_availabilities` (temporary/planning reservations)
- `tasks` (work orders)
- `work_groups` (staff teams)
- `work_group_tasks`, `work_group_profiles` (team assignments)
- `notes` (internal communications)
- `repair_task_comments` (repair task discussions)
- `profiles` (user accounts)
- `profile_work_schedule`, `profile_work_days` (staff scheduling)

Real-time channel is initialized in AuthService after login and cleaned up on logout.

### Service Layer Architecture

Services follow a clear separation of concerns:

- **Core Infrastructure Services:**
  - `SupabaseService`: Database client wrapper, provides `getData()`, `updateData()`, `insertData()`, `deleteData()`
  - `AuthService`: Authentication, session management, token refresh, logout flow
  - `DataService`: Centralized state management (see above)
  - `StorageService`: LocalStorage wrapper with typed keys

- **Domain Services:**
  - `TaskService`: Task CRUD, image compression for damage reports, storage bucket operations
  - `HouseService`: House/property CRUD, availability management
  - `WorkGroupService`: Team management, member assignment/removal
  - `WorkScheduleService`: Staff scheduling operations
  - `ProfileService`: User profile operations, password management
  - `NotesService`: Internal notes CRUD
  - `StatisticsService`: Data aggregation for charts and analytics

- **Feature Services:**
  - `PushNotificationsService`: Firebase FCM token management
  - `DeviceService`: Device registration/unregistration for push notifications
  - `ExportReservationsService`: Excel export with styling using xlsx-js-style
  - `LanguageService`: i18n support (English/Croatian)
  - `SeasonService`: Seasonal year management for reservations

### Authentication & Authorization

- **Auth Flow:** Login → Supabase Auth → Store user ID in localStorage → Setup realtime listener → Navigate to home
- **Session Management:** Token refresh happens automatically when token expires within 1 minute (checked in `AuthService.isTokenExpired()`)
- **Route Guards:**
  - `AuthGuard`: Protects all authenticated routes
  - `LoginGuard`: Redirects authenticated users away from login page
  - `RoleGuard`: Checks user role permissions for each route (uses `data.roles` in route config)
  - `TeamsGuard`, `TeamDetailGuard`: Specific team page access control
- **User Roles:** 13+ roles defined in `ProfileRoles` enum (VoditeljKampa, Uprava, Recepcija, Sobarica, KucniMajstor, etc.)
- **Edge Function:** `supabase/functions/user-role/` validates JWT and returns user access data

### Database Schema

All tables are in the `porton` schema (NOT `public`). Key tables:

- `houses`, `house_types` - Property inventory
- `house_availabilities` - Active reservations
- `temp_house_availabilities` - Planning/temporary reservations
- `tasks`, `task_types`, `task_progress_types` - Work orders and task tracking
- `work_groups`, `work_group_members`, `work_group_tasks` - Staff teams and assignments
- `profiles`, `profile_roles` - User accounts and roles
- `profile_work_schedule`, `profile_work_days` - Staff scheduling
- `notes` - Internal communications
- `repair_task_comments` - Repair task comments with images
- `seasons` - Yearly planning periods
- `pinned_charts` - Dashboard chart configurations
- `user_devices` - Push notification device tokens

**IMPORTANT:** Always use `this.schema = 'porton'` when calling SupabaseService methods.

### Component Architecture

- **Standalone Components:** All components use Angular 19 standalone architecture (no NgModules)
- **Layout Structure:**
  - `AppLayout` wraps all authenticated pages with sidebar navigation
  - Layout state managed by `LayoutService` (sidebar open/closed, mobile detection)
- **Page Components:** Located in `src/app/pages/`, each is a standalone component
- **Shared Components:** Reusable components in `src/app/shared/`

### Custom RxJS Operators

The app includes custom operators in `src/app/shared/rxjs-operators/`:
- `nonNull()`: Filters out null/undefined values from observables
- Used extensively: `this.dataService.tasks$.pipe(nonNull()).subscribe(...)`

## Common Patterns & Conventions

### Data Loading Pattern

```typescript
// Components typically load data like this:
constructor(private dataService: DataService) {
  this.dataService.tasks$
    .pipe(nonNull())
    .subscribe(tasks => {
      this.tasks = tasks;
      // Process tasks
    });
}
```

### Task Management Pattern

Tasks have 5 progress states (in `task_progress_types`):
1. Nije dodijeljeno (Not assigned)
2. Dodijeljeno (Assigned)
3. U tijeku (In progress)
4. Pauzirano (Paused)
5. Završeno (Completed)
6. Potvrđeno (Confirmed)

Tasks are assigned to work groups via the `work_group_tasks` junction table.

### Reservation System Pattern

- **Dual reservation tables:** `house_availabilities` (active) and `temp_house_availabilities` (planning)
- **Season-based:** Reservations tied to `seasons` table for yearly planning
- **House types:** Family 1, Family 2, Couple, Mobile (stored in `house_types`)
- **Color-coded status:** Arrival, departure, occupied, available, etc.

### Image Storage Pattern

Repair task images are stored in Supabase Storage:
- Bucket: `damage-reports-images`
- Path structure: `task-{taskId}/{filename}`
- Images are compressed before upload using `browser-image-compression`
- Access via: `DataService.getStoredImagesForTask()` and `getPublicUrlForImage()`

### i18n Pattern

Translation files in `src/assets/i18n/`:
- `en.json` (English)
- `hr.json` (Croatian - Hrvatski)

Language is stored in localStorage and used to set Angular LOCALE_ID at app bootstrap.

## Important Implementation Notes

### Role-Based Access Control

Route access is defined in `app.routes.ts` using role arrays:
```typescript
{
  path: 'daily-sheet',
  component: DailySheetComponent,
  data: { roles: DAILY_SHEET_ROLES }  // Checked by RoleGuard
}
```

The `RoleGuard` compares user's role (from profile) against allowed roles in route data.

### Build Configuration

- **Bundle Size Limits:** Initial bundle max 20MB, component styles max 1MB
- **PWA:** Service worker enabled in production
- **Assets:** Must include `manifest.webmanifest` and `firebase-messaging-sw.js`
- **External CSS:** Handsontable and Mapbox GL CSS are imported in `angular.json`

### Authentication Token Lifecycle

- Tokens stored in Supabase client (not localStorage)
- Token refresh triggered automatically when < 1 minute until expiry
- Session validation on app load via `AuthService.checkSession()`
- Realtime channel authenticated with access token via `setRealtimeAuth()`

### Firebase Integration

- FCM (Firebase Cloud Messaging) for push notifications
- Service worker: `src/firebase-messaging-sw.js`
- Token management in `PushNotificationsService`
- Device tokens stored in `user_devices` table

### Mapbox & 3D Models

- Mapbox token required in environment config (not included in repo)
- 3D house models: `.glb` files in `src/assets/models/`
- Three.js used for 3D rendering overlaid on Mapbox map
- Map component: `src/app/pages/map/map.component.ts`

## Testing Notes

- Test framework: Jasmine + Karma
- Test users can be created via `AuthService.createTestUsers()` (creates 10 test users)
- Real users initialized via `AuthService.createRealUsers()` (production user accounts)
- Special "Deleted User" with hardcoded ID `11111111-1111-1111-1111-111111111111` used as placeholder

## Environment Configuration

The project uses environment files:
- `src/environments/environment.ts` - Local development with Supabase local instance
- `src/environments/environment.test.ts` - Test environment (if exists)
- **DO NOT commit production credentials** - use environment-specific files

Local environment expects:
- Supabase URL: `http://127.0.0.1:54321`
- Firebase config with API keys and project ID
- Mapbox token (for map features)

## Development Workflow

1. **Start Supabase:** `supabase start` (starts Docker containers)
2. **Apply migrations:** `supabase db reset` (if schema changes)
3. **Start dev server:** `ng serve`
4. **Make changes:** Edit components/services
5. **Test:** Run `ng test` or test manually in browser
6. **Format:** `npm run format` before committing
7. **Build:** `ng build` to verify production build works

## Common Pitfalls

- **Schema confusion:** Always use `porton` schema, NOT `public` schema
- **State management:** Never bypass DataService - always update state through it
- **Realtime subscriptions:** Ensure channel is cleaned up on logout (memory leaks)
- **File size limits:** Storage bucket has 50MB limit per file
- **Token expiry:** Session checks happen on route navigation - test expired token scenarios
- **Mobile detection:** LayoutService tracks mobile state - some features disabled on mobile
- **Role checking:** User roles are in `profile_roles` table, not in JWT claims directly
