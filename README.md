# PortonCare

A comprehensive property and campground management system built with Angular 19, designed for handling reservations, housekeeping tasks, staff scheduling, and facility maintenance.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Supabase Setup](#supabase-setup)
- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
- [User Roles](#user-roles)
- [API & Database](#api--database)
- [Building & Deployment](#building--deployment)
- [Testing](#testing)

## Overview

PortonCare is a Progressive Web Application (PWA) that provides a complete solution for managing holiday parks, campgrounds, and rental property facilities. It handles everything from guest reservations and property availability to staff task assignments and work scheduling.

## Features

### Reservation Management
- Calendar-based reservation view with multi-house tracking
- Season-based yearly planning
- House type filtering (Family 1, Family 2, Couple, Mobile)
- Arrival/departure tracking with color-coded availability
- Export reservations to Excel (.xlsx)

### Property/House Management
- House inventory tracking with types and categories
- Pool availability tracking
- Active/inactive status management
- Occupancy details (adults, children, cribs, pets)
- House descriptions and numbering

### Task Management (Work Orders)
- Task types: House cleaning, deck cleaning, repairs, sheet changes, towel changes
- Progress tracking: Not assigned, Assigned, In progress, Paused, Completed
- Task assignment to work groups
- Task archiving and historical tracking
- Repair task comments with image support

### Staff & Work Group Management
- Work group (team) creation and management
- Staff assignment to teams
- Work group locking to prevent modifications
- Repair vs. regular work designation
- 13+ configurable user roles

### Work Scheduling
- Calendar-based staff scheduling
- Configurable work hours per day
- Color-coded schedule blocks
- Visual schedule ranges (start/middle/end)

### Interactive Mapping
- Mapbox-based facility map with geolocation
- 3D house models using Three.js
- House number overlays and icons
- House selection with sidebar details
- Task visualization on map
- Availability color coding

### Statistics & Analytics
- Multiple chart types (bar, line, scatter, pie, doughnut, polar, radar)
- Configurable metrics and periods
- Pinnable charts to home dashboard

### Communication & Notifications
- Internal notes system with timestamps
- Push notifications via Firebase Cloud Messaging
- Console messages for admin communication
- Real-time notifications for task completion

### Internationalization
- English and Croatian language support
- Dynamic language switching
- Locale-based number/date formatting

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Angular | 19.0 | Core framework with standalone components |
| RxJS | 7.8 | Reactive programming |
| PrimeNG | 19.0.8 | UI component library |
| TailwindCSS | 3.4 | Utility-first CSS framework |
| Angular Material | 19.0.4 | Additional UI components |

### Mapping & 3D
| Technology | Version | Purpose |
|------------|---------|---------|
| Mapbox GL | 3.16 | Interactive maps |
| Three.js | 0.181 | 3D graphics and models |
| ngx-mapbox-gl | 12.0 | Angular Mapbox integration |

### Backend & Data
| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | 2.49.4 | PostgreSQL backend with real-time |
| Firebase | 11.9.1 | Authentication & push notifications |
| @angular/fire | 20.0.1 | Firebase integration |

### Data Export
| Technology | Purpose |
|------------|---------|
| Handsontable | Spreadsheet-like data grids |
| jsPDF | PDF generation |
| xlsx-js-style | Excel export with styling |
| html2canvas | Screenshot to image |

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Angular CLI 19.0.6+
- Supabase CLI (for local development)
- Docker (for local Supabase)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd porton
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment files:
```bash
# Copy and configure environment files
cp src/environments/environment.example.ts src/environments/environment.ts
```

### Development Server

Start the local development server:
```bash
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload on file changes.

### Supabase Setup

1. Start local Supabase:
```bash
supabase start
```

2. Apply migrations:
```bash
supabase db reset
```

3. Local Supabase will be available at `http://127.0.0.1:54321`

## Project Structure

```
src/
├── app/
│   ├── core/                    # Business logic & services
│   │   ├── guards/              # Route guards (auth, role-based)
│   │   ├── services/            # Core services (~16 services)
│   │   └── models/              # TypeScript interfaces & enums
│   │
│   ├── pages/                   # Standalone page components
│   │   ├── auth/                # Login page
│   │   ├── home/                # Dashboard
│   │   ├── reservations/        # Reservation calendar
│   │   ├── daily-sheet/         # Daily task assignments
│   │   ├── teams/               # Work group management
│   │   ├── map/                 # Interactive facility map
│   │   ├── work-schedule/       # Staff scheduling
│   │   ├── task-archive/        # Historical tasks
│   │   ├── arrivals-and-departures/
│   │   ├── statistics/          # Analytics & charts
│   │   ├── notes/               # Internal notes
│   │   └── ...                  # Additional pages
│   │
│   ├── layout/                  # App shell & navigation
│   │   ├── components/          # Layout components
│   │   └── services/            # Layout state management
│   │
│   ├── shared/                  # Reusable utilities
│   │   ├── rxjs-operators/      # Custom RxJS operators
│   │   ├── pipes/               # Custom Angular pipes
│   │   └── debug-overlay/       # Dev utilities
│   │
│   └── firebase/                # Firebase initialization
│
├── environments/                # Environment configs
├── assets/
│   ├── icons/                   # PWA icons
│   ├── models/                  # 3D models (.glb)
│   └── i18n/                    # Translation files (en, hr)
│
├── styles.scss                  # Global styles
├── tailwind.css                 # Tailwind utilities
├── app.config.ts                # Angular providers
├── app.routes.ts                # Route definitions
└── main.ts                      # Bootstrap entry
```

## Core Modules

### Services

| Service | Responsibility |
|---------|----------------|
| `auth.service.ts` | Authentication, session validation, token refresh |
| `supabase.service.ts` | Database client wrapper, CRUD operations |
| `data.service.ts` | Central state management with BehaviorSubjects |
| `task.service.ts` | Task operations, image compression |
| `house.service.ts` | House CRUD, availability management |
| `work-group.service.ts` | Team management, member assignment |
| `work-schedule.service.ts` | Staff schedule operations |
| `profile.service.ts` | User profile operations |
| `push-notifications.service.ts` | Firebase FCM token management |
| `statistics.service.ts` | Data aggregation for charts |
| `season.service.ts` | Seasonal year management |
| `notes.service.ts` | Internal notes CRUD |
| `language.service.ts` | i18n and language switching |
| `export-reservations.service.ts` | Excel export with styling |

### Guards

| Guard | Purpose |
|-------|---------|
| `auth.guard.ts` | Protects routes requiring authentication |
| `login.guard.ts` | Redirects authenticated users from login |
| `role.guard.ts` | Role-based access control |
| `teams.guard.ts` | Team page access control |
| `team-detail.guard.ts` | Team detail page access |

## User Roles

The system supports 13+ user roles with granular access control:

| Role | Access Level |
|------|--------------|
| Administrator | Full system access |
| Reception Lead | Reservations, arrivals, scheduling |
| Housekeeper | Task management, daily sheets |
| Terrace Staff | Task management |
| Maintenance | Repairs, task archive |
| Master Craftsman | Repairs, maintenance tasks |
| Management | Statistics, reports, overview |
| Advisor | Read-only access to most features |

## API & Database

### Supabase Schema

The application uses a custom `porton` schema with the following primary tables:

- **houses** - Property inventory
- **house_types** - Property classifications
- **profiles** - User accounts
- **profile_roles** - Role assignments
- **work_groups** - Staff teams
- **work_group_members** - Team memberships
- **tasks** - Work orders
- **task_types** - Task classifications
- **house_availability** - Reservations/occupancy
- **work_schedules** - Staff scheduling
- **notes** - Internal communications
- **seasons** - Yearly planning periods
- **pinned_charts** - Dashboard configurations

### Real-time Subscriptions

Supabase real-time is enabled for:
- Task status changes
- Work group updates
- Notes and communications

## Building & Deployment

### Production Build

```bash
ng build --configuration production
```

Build artifacts are stored in `dist/sakai-ng/`.

### Build Budgets

- Initial bundle: 10MB max
- Component styles: 1MB max per component

### PWA Support

The application is configured as a Progressive Web App with:
- Service Worker support
- App manifest with multiple icon sizes
- Firebase Cloud Messaging for push notifications

### Deployment Options

- **Vercel**: Configuration available in project
- **Firebase Hosting**: Configured with Firestore indexes
- **Custom Server**: Deploy `dist/` folder to any static hosting

## Testing

### Unit Tests

Run unit tests with Karma:
```bash
ng test
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Format with Prettier
npm run format
```

### Test Users

The auth service supports test user creation for development and QA purposes.

## Configuration Files

| File | Purpose |
|------|---------|
| `angular.json` | Angular build configuration |
| `tailwind.config.js` | TailwindCSS customization |
| `supabase/config.toml` | Local Supabase Docker setup |
| `manifest.webmanifest` | PWA metadata |
| `.prettierrc.json` | Code formatting rules |
| `tsconfig.json` | TypeScript compiler options |

## License

Proprietary - All rights reserved.
