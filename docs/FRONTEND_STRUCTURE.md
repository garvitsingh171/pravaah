# Frontend Folder Structure

## 1. Purpose

This document explains the frontend folder structure for the Pravaah React TypeScript app.

The goal is to keep the frontend codebase clean, predictable, and easy to grow as Pravaah adds dashboard, clinic settings, doctor management, patient management, appointment management, queue management, authentication, shared UI components, and API integration.

This document is focused only on frontend organization. It does not introduce new product features, backend logic, authentication implementation, database changes, or routing behavior.

## 2. Frontend stack

The Pravaah frontend uses:

- React
- TypeScript
- Vite
- Tailwind CSS

The frontend lives inside:

```txt
apps/web
```

The main frontend source folder is:

```txt
apps/web/src
```

## 3. Suggested source structure

Use this structure as the frontend grows:

```txt
apps/web/src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── clinics/
│   ├── doctors/
│   ├── patients/
│   ├── appointments/
│   └── queues/
├── lib/
├── routes/
├── types/
└── main.tsx
```

This structure separates app-level setup, reusable UI, feature-specific code, utilities, routing, and shared TypeScript types.

## 4. Folder responsibilities

## 4.1 `app/`

The `app` folder is for app-level structure and composition.

Use this folder for files that define the overall frontend shell or app-level providers.

Examples:

```txt
apps/web/src/app/
├── AppLayout.tsx
└── providers.tsx
```

Good use cases:

- base layout shell
- app-level provider composition
- global app wrappers
- layout composition used across multiple screens

Avoid placing feature-specific business UI directly in this folder.

For example, a full appointment booking form should not live in `app/`. It should live in the appointments feature folder.

## 4.2 `components/`

The `components` folder is for reusable UI components that are not tied to one specific feature.

Examples:

```txt
apps/web/src/components/
├── layout/
│   ├── Sidebar.tsx
│   └── Topbar.tsx
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Badge.tsx
└── feedback/
    ├── EmptyState.tsx
    └── ErrorMessage.tsx
```

Good use cases:

- buttons
- inputs
- badges
- cards
- layout components
- loading states
- empty states
- error messages

Rule:

If a component can be reused by multiple features, keep it in `components/`.

If it belongs only to one feature, keep it inside that feature folder.

## 4.3 `features/`

The `features` folder is for product-specific frontend modules.

Each feature should own its screens, components, hooks, and feature-specific helpers.

Suggested MVP feature folders:

```txt
apps/web/src/features/
├── auth/
├── dashboard/
├── clinics/
├── doctors/
├── patients/
├── appointments/
└── queues/
```

### `features/auth/`

Use this folder for frontend authentication-related UI and helpers.

Possible future files:

```txt
features/auth/
├── SignInScreen.tsx
├── ProtectedRoute.tsx
└── auth.types.ts
```

Important:

Frontend route protection is useful for user experience, but backend authorization is still mandatory. The frontend must never be treated as the final source of truth for permissions.

### `features/dashboard/`

Use this folder for the clinic dashboard screen and dashboard-specific components.

Possible future files:

```txt
features/dashboard/
├── DashboardScreen.tsx
├── DashboardStats.tsx
└── TodayOverview.tsx
```

The dashboard should focus on useful clinic operations such as today's appointments, waiting queue count, completed appointments, cancelled/no-show appointments, and visible high-risk appointments.

### `features/clinics/`

Use this folder for clinic profile and settings screens.

Possible future files:

```txt
features/clinics/
├── ClinicSettingsScreen.tsx
├── ClinicForm.tsx
└── clinic.types.ts
```

This feature should handle frontend UI for clinic name, contact details, location, opening time, closing time, slot duration, and buffer settings.

### `features/doctors/`

Use this folder for doctor management screens and components.

Possible future files:

```txt
features/doctors/
├── DoctorListScreen.tsx
├── DoctorForm.tsx
├── DoctorCard.tsx
└── doctor.types.ts
```

Doctor UI should stay aligned with the MVP decision that doctors are records only and do not log in during MVP.

### `features/patients/`

Use this folder for patient management screens and components.

Possible future files:

```txt
features/patients/
├── PatientListScreen.tsx
├── PatientForm.tsx
├── PatientCard.tsx
└── patient.types.ts
```

Patient UI should stay aligned with the MVP decision that patients are records only and do not log in during MVP.

### `features/appointments/`

Use this folder for appointment booking, appointment lists, appointment status updates, and appointment-specific UI.

Possible future files:

```txt
features/appointments/
├── AppointmentListScreen.tsx
├── AppointmentBookingForm.tsx
├── AppointmentStatusBadge.tsx
└── appointment.types.ts
```

Appointment UI should support the core workflow of booking appointments for a clinic, doctor, and patient.

### `features/queues/`

Use this folder for today's live queue screen and queue-specific UI.

Possible future files:

```txt
features/queues/
├── QueueScreen.tsx
├── QueueTable.tsx
├── QueueStatusBadge.tsx
└── queue.types.ts
```

Queue UI should support human-controlled clinic operations. The system may assist staff, but it should not automatically cancel appointments or reorder the queue without staff action.

## 4.4 `lib/`

The `lib` folder is for reusable frontend utilities and configuration helpers.

Examples:

```txt
apps/web/src/lib/
├── apiClient.ts
├── constants.ts
├── formatDate.ts
└── cn.ts
```

Good use cases:

- API client setup
- frontend-safe constants
- formatting helpers
- class name helpers
- reusable utility functions

Avoid putting React screens or feature-specific components in `lib/`.

## 4.5 `routes/`

The `routes` folder is for route definitions and route-level organization when routing is added.

Possible future files:

```txt
apps/web/src/routes/
├── AppRoutes.tsx
└── routePaths.ts
```

Good use cases:

- route path constants
- route tree configuration
- mapping routes to screens
- protected route wrappers

Routing should be added only when needed by a specific issue. This documentation does not add routing implementation.

## 4.6 `types/`

The `types` folder is for shared frontend TypeScript definitions.

Examples:

```txt
apps/web/src/types/
├── api.ts
├── domain.ts
├── enums.ts
└── index.ts
```

Good use cases:

- shared domain types
- API response types
- enum-like constants and union types
- reusable frontend type definitions

Examples of shared Pravaah types:

```txt
UserRole
UserStatus
AppointmentStatus
QueueStatus
RiskLevel
BookingSource
PatientSummary
DoctorSummary
AppointmentSummary
ApiResponse<T>
```

Component-specific props do not need to go here. If a type is used by only one component, keep it near that component.

## 5. Where future MVP screens should go

Future MVP screens should live inside the relevant feature folder.

Examples:

```txt
Dashboard screen              → features/dashboard/
Clinic settings screen        → features/clinics/
Doctor management screen      → features/doctors/
Patient management screen     → features/patients/
Appointment booking/list UI   → features/appointments/
Live queue screen             → features/queues/
Authentication UI             → features/auth/
```

Shared UI used by many screens should go in:

```txt
components/
```

Shared TypeScript definitions should go in:

```txt
types/
```

Reusable frontend utilities should go in:

```txt
lib/
```

App-level layout and providers should go in:

```txt
app/
```

## 6. Frontend responsibility boundaries

The frontend should:

- render the clinic staff UI
- collect form input
- manage local UI state
- call backend APIs
- show loading states
- show empty states
- show error states
- show no-show risk badges and explanations
- protect private routes at the UI level when authentication is added

The frontend should not:

- make final authorization decisions
- store secrets
- directly connect to the database
- bypass backend validation
- trust frontend-only role values
- implement backend business rules as the source of truth

Backend authorization remains mandatory.

## 7. What not to add during frontend structure work

Do not add these only for folder structure:

- Next.js
- new frontend framework
- patient portal
- doctor portal
- mobile app structure
- backend API logic
- database schema changes
- Clerk integration unless the issue specifically asks for it
- real dashboard analytics
- advanced AI UI
- WhatsApp/SMS/notification UI

This document only defines organization rules.

## 8. Naming guidelines

Use clear and predictable names.

Good examples:

```txt
DashboardScreen.tsx
ClinicSettingsScreen.tsx
DoctorForm.tsx
PatientCard.tsx
AppointmentStatusBadge.tsx
QueueTable.tsx
apiClient.ts
routePaths.ts
```

Avoid vague names:

```txt
Stuff.tsx
Data.tsx
Common.tsx
Helper.tsx
NewPage.tsx
```

## 9. Import guidelines

Prefer importing shared types from the central `types` export file.

Example:

```ts
import type { AppointmentSummary, ApiResponse } from '../types';
```

Prefer importing feature-specific code from the relevant feature folder.

Example:

```ts
import AppointmentBookingForm from '../features/appointments/AppointmentBookingForm';
```

Avoid deep and confusing imports when a cleaner export structure exists.

## 10. Final principle

Keep frontend structure simple, consistent, and MVP-focused.

Build the frontend around the clinic-side workflow:

```txt
Dashboard → Clinic → Doctors → Patients → Appointments → Queue → Risk display
```

Do not turn the frontend into a hospital ERP, patient portal, or advanced analytics product before the MVP workflow is working.
