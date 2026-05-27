# Pravaah Architecture

## 1. Architecture Goal

Pravaah is being designed as a serious MVP, not as a temporary college project.

The architecture should support:

- clean frontend-backend separation
- PostgreSQL database design
- future SaaS expansion
- clinic-side user management
- doctor and patient management
- appointment scheduling
- live queue management
- AI-assisted no-show prediction
- future patient login
- future doctor login
- future analytics
- future recommendation system

The MVP must stay simple enough to build by **12 July 2026**, with **3 to 4 hours daily development time**, but the database and code structure should not block future growth.

---

## 2. High-Level System Architecture

```txt
User Browser
    ↓
React + TypeScript Frontend
    ↓
Express + TypeScript Backend API
    ↓
Prisma ORM
    ↓
PostgreSQL Database
```

External services:

```txt
Clerk → Authentication
OpenAI API / Rule Engine → No-show prediction support
Vercel → Frontend deployment
Render → Backend deployment
Supabase → PostgreSQL database hosting
```

---

## 3. Monorepo Architecture

Pravaah will use a simple monorepo structure.

```txt
pravaah/
├── client/
├── server/
├── shared/
├── docs/
├── README.md
├── package.json
├── package-lock.json
└── .gitignore
```

### Why Monorepo?

Because Pravaah is a solo project and the frontend, backend, and shared code belong to the same product.

Benefits:

- one GitHub repository
- easier project management
- easier for GitHub Copilot and AI tools to understand the full project
- shared types can be reused
- frontend and backend stay synchronized
- simpler for solo development

---

## 4. Folder Structure

## 4.1 Root Structure

```txt
pravaah/
├── client/                  # React frontend
├── server/                  # Express backend
├── shared/                  # Shared types/constants/schemas
├── docs/                    # Project documentation
├── README.md                # Project overview
├── package.json             # Root workspace config
├── package-lock.json
└── .gitignore
```

---

## 4.2 Client Structure

```txt
client/
├── src/
│   ├── app/
│   ├── pages/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── doctors/
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── queue/
│   │   └── predictions/
│   │
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── types/
│   ├── constants/
│   └── main.tsx
│
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Client Responsibilities

The frontend is responsible for:

- displaying UI
- handling forms
- calling backend APIs
- showing dashboard data
- showing queue state
- showing no-show risk badges
- handling protected routes
- giving users a clean experience

The frontend should not contain business-critical database logic.

---

## 4.3 Server Structure

```txt
server/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── middlewares/
│   ├── validations/
│   ├── utils/
│   ├── config/
│   └── index.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── package.json
└── tsconfig.json
```

### Server Responsibilities

The backend is responsible for:

- API routes
- authentication verification
- authorization checks
- business logic
- database communication
- appointment rules
- queue rules
- prediction generation
- validation
- error handling

---

## 4.4 Shared Structure

```txt
shared/
├── types/
├── constants/
├── schemas/
└── index.ts
```

### What Goes in Shared?

The shared folder contains code used by both frontend and backend.

Examples:

```ts
export const APPOINTMENT_STATUSES = [
  "SCHEDULED",
  "ARRIVED",
  "COMPLETED",
  "LATE",
  "NO_SHOW",
  "CANCELLED",
] as const;
```

Shared can include:

- common types
- enums
- constants
- validation schemas

This avoids duplicating the same values in both client and server.

---

## 5. Backend Layered Architecture

The backend will follow layered architecture.

```txt
Route → Controller → Service → Repository → Database
```

---

## 5.1 Routes

Routes define API endpoints.

Example:

```txt
GET /api/doctors
POST /api/doctors
GET /api/patients
POST /api/patients
POST /api/appointments
PATCH /api/appointments/:id/status
GET /api/queue/today
GET /api/dashboard/summary
```

Routes should stay thin.

---

## 5.2 Controllers

Controllers handle request and response.

They should:

- read request body
- read request params
- call service functions
- return response
- handle errors cleanly

Controllers should not contain complex business logic.

---

## 5.3 Services

Services contain business logic.

Examples:

- check whether doctor is available
- prevent duplicate appointment slots
- create queue entry after appointment creation
- generate no-show prediction
- update appointment status
- update patient statistics
- calculate dashboard summary

Most important Pravaah logic lives here.

---

## 5.4 Repositories

Repositories communicate with the database using Prisma.

Examples:

- create doctor
- find patient by phone
- create appointment
- update appointment status
- fetch today’s queue

Repositories should not decide business rules.

They should mainly perform database operations.

---

## 5.5 Database

PostgreSQL stores structured data.

Prisma is used as ORM.

Prisma responsibilities:

- schema definition
- migrations
- type-safe database queries
- seed data

---

## 6. API Modules

MVP backend modules:

```txt
/api/users
/api/clinics
/api/doctors
/api/patients
/api/appointments
/api/queue
/api/predictions
/api/dashboard
```

Build order:

```txt
1. clinics
2. users
3. doctors
4. patients
5. appointments
6. queue
7. predictions
8. dashboard
```

---

## 7. Database Architecture

## 7.1 Final MVP Entities

Core entities:

```txt
User
Clinic
Doctor
DoctorClinic
Patient
PatientClinic
Appointment
QueueEntry
NoShowPrediction
```

Future-ready optional entities:

```txt
AppointmentGroup
AppointmentStatusLog
```

---

## 7.2 Entity Meaning

### User

A user is someone who can log in to Pravaah.

MVP users:

- Admin
- Staff

Future users:

- Doctor
- Patient
- Super Admin

---

### Clinic

A clinic is the organization/business using Pravaah.

A clinic is not the same as a user.

Example:

```txt
Clinic: Mehta Dental Clinic
User: Ramesh, clinic owner
Doctor: Dr. Mehta
Patient: Garvit Singh
```

---

### Doctor

Doctor is the professional profile.

A doctor may work at many clinics in the future.

---

### DoctorClinic

DoctorClinic connects a doctor with a clinic.

This supports many-to-many relationship.

Example:

```txt
Dr. Sharma works at Clinic A
Dr. Sharma works at Clinic B
```

This creates two DoctorClinic records.

---

### Patient

Patient is the person receiving healthcare service.

A patient may visit many clinics in the future.

---

### PatientClinic

PatientClinic connects a patient with a clinic and stores clinic-specific behavior.

Example:

```txt
Same patient at Clinic A: 0 no-shows
Same patient at Clinic B: 3 no-shows
```

This is why no-show history is stored at patient-clinic level.

---

### Appointment

Appointment is the scheduled meeting between patient and doctor inside a clinic.

Appointment connects:

```txt
Clinic + Doctor + Patient + Time
```

---

### QueueEntry

QueueEntry represents live clinic flow.

Appointment means planned schedule.  
QueueEntry means what is happening right now.

This is essential because Pravaah is not just appointment booking. It is flow management.

---

### NoShowPrediction

NoShowPrediction stores the risk prediction for an appointment.

It includes:

- risk level
- risk score
- reason
- suggested action
- factors used
- model/rule version

This allows future analytics and prediction improvement.

---

## 8. Final Relationships

```txt
User
 └── belongs to Clinic

Clinic
 ├── has many Users
 ├── has many DoctorClinic records
 ├── has many PatientClinic records
 ├── has many Appointments
 ├── has many QueueEntries
 └── has many AppointmentGroups

Doctor
 ├── may connect to User in future
 ├── has many DoctorClinic records
 └── has many Appointments

Patient
 ├── may connect to User in future
 ├── has many PatientClinic records
 └── has many Appointments

DoctorClinic
 ├── belongs to Doctor
 └── belongs to Clinic

PatientClinic
 ├── belongs to Patient
 └── belongs to Clinic

Appointment
 ├── belongs to Clinic
 ├── belongs to Doctor
 ├── belongs to Patient
 ├── belongs to User as creator
 ├── may belong to AppointmentGroup
 ├── has one QueueEntry
 └── has one NoShowPrediction

QueueEntry
 └── belongs to Appointment

NoShowPrediction
 └── belongs to Appointment

AppointmentGroup
 └── has many Appointments

AppointmentStatusLog
 └── belongs to Appointment
```

---

## 9. Entity Fields

## 9.1 User

```txt
id
clerkId
name
email
phone
avatarUrl
role
clinicId
isActive
lastLoginAt
createdAt
updatedAt
```

Roles:

```txt
ADMIN
STAFF
DOCTOR       future
PATIENT      future
SUPER_ADMIN  future
```

---

## 9.2 Clinic

```txt
id
name
slug
address
city
state
country
pincode
phone
email
timezone
openingTime
closingTime
slotDurationMinutes
bufferTimeMinutes
isActive
createdAt
updatedAt
```

---

## 9.3 Doctor

```txt
id
userId nullable
name
phone
email
gender
specialization
registrationNumber
qualification
experienceYears
profilePhotoUrl
isActive
createdAt
updatedAt
```

`userId` is nullable because doctor login is not part of MVP but can be added later.

---

## 9.4 DoctorClinic

```txt
id
doctorId
clinicId
consultationFee
defaultSlotDurationMinutes
isAvailable
joiningDate
createdAt
updatedAt
```

Future fields:

```txt
workingDays
startTime
endTime
roomNumber
```

---

## 9.5 Patient

```txt
id
userId nullable
name
phone
email
age
gender
dateOfBirth
address
city
state
pincode
emergencyContactName
emergencyContactPhone
createdAt
updatedAt
```

`userId` is nullable because patient login is not part of MVP but can be added later.

---

## 9.6 PatientClinic

```txt
id
patientId
clinicId
clinicPatientCode
patientType
distanceFromClinicKm
totalAppointments
totalNoShows
totalLateArrivals
lastVisitAt
notes
createdAt
updatedAt
```

Patient types:

```txt
REGULAR
FIRST_TIME
WALK_IN
REFERRED
```

---

## 9.7 Appointment

```txt
id
clinicId
doctorId
patientId
groupId nullable
scheduledAt
durationMinutes
status
appointmentType
bookingSource
reasonForVisit
notes
cancelledAt
cancelReason
rescheduledFromAppointmentId nullable
createdByUserId
createdAt
updatedAt
```

MVP statuses:

```txt
SCHEDULED
ARRIVED
COMPLETED
LATE
NO_SHOW
CANCELLED
```

Future statuses:

```txt
CONFIRMED
IN_QUEUE
IN_PROGRESS
RESCHEDULED
SKIPPED
```

Appointment types:

```txt
CONSULTATION
FOLLOW_UP
EMERGENCY
```

Booking sources:

```txt
RECEPTION
PHONE_CALL
WEBSITE
WHATSAPP
PATIENT_APP
```

---

## 9.8 AppointmentGroup

```txt
id
clinicId
primaryPatientId
groupType
notes
createdAt
updatedAt
```

Group types:

```txt
FAMILY
COUPLE
FRIENDS
OTHER
```

MVP decision:

```txt
Keep in architecture.
Build only if time allows.
```

---

## 9.9 QueueEntry

```txt
id
clinicId
appointmentId
queueDate
position
status
estimatedStartTime
actualStartTime
completedAt
skippedAt
waitTimeMinutes
createdAt
updatedAt
```

Queue statuses:

```txt
WAITING
IN_PROGRESS
COMPLETED
SKIPPED
NO_SHOW
```

Future statuses:

```txt
CALLED
DELAYED
REJOINED
```

---

## 9.10 NoShowPrediction

```txt
id
appointmentId
riskLevel
riskScore
reason
suggestedAction
factors
modelUsed
predictionVersion
createdAt
updatedAt
```

Risk levels:

```txt
LOW
MEDIUM
HIGH
```

Future fields:

```txt
actualOutcome
confidence
feedbackByStaff
accuracyStatus
```

---

## 9.11 AppointmentStatusLog

```txt
id
appointmentId
oldStatus
newStatus
changedByUserId
reason
createdAt
```

MVP decision:

```txt
Optional, but useful for future analytics.
```

---

## 10. Queue Architecture

Queue is one of the most important parts of Pravaah.

### Appointment vs QueueEntry

```txt
Appointment = scheduled plan
QueueEntry = live operational state
```

Example:

```txt
10:00 AM - Patient A
10:15 AM - Patient B
10:30 AM - Patient C
```

If Patient B is late, the queue may become:

```txt
Patient A
Patient C
Patient B
```

The appointment time should remain unchanged, but the queue position can change.

This separation protects historical appointment data while allowing real-time clinic flow adjustment.

---

## 11. Prediction Architecture

No-show prediction will be built in stages.

## Stage 1: Rule-Based Prediction

Use simple rules:

```txt
If totalNoShows >= 2 → HIGH
If distanceFromClinicKm > 10 and appointment is in evening → MEDIUM
If totalLateArrivals >= 2 → MEDIUM
Otherwise → LOW
```

This is easy to build, test, and explain.

---

## Stage 2: AI-Assisted Explanation

After rule-based prediction works, AI can generate better explanations and staff actions.

Input to AI:

```txt
patient history
appointment time
distance from clinic
previous no-shows
previous late arrivals
patient type
```

Output:

```txt
risk level
reason
suggested action
```

---

## 12. Authentication Architecture

Use Clerk for authentication.

Flow:

```txt
User signs in through Clerk
        ↓
Frontend receives auth session
        ↓
Frontend sends request to backend with auth token
        ↓
Backend verifies token
        ↓
Backend maps Clerk user to internal User record
        ↓
Backend applies clinic-level access control
```

MVP roles:

```txt
ADMIN
STAFF
```

---

## 13. Authorization Rules

Basic rules:

```txt
1. User can only access their own clinic data.
2. Admin can manage clinic settings.
3. Admin can manage doctors and staff.
4. Staff can manage patients, appointments, and queue.
5. No user can access another clinic’s data.
```

This is important for SaaS readiness.

---

## 14. Frontend Pages

MVP pages:

```txt
/login
/dashboard
/doctors
/patients
/appointments
/queue
/settings
```

Optional pages:

```txt
/appointments/:id
/patients/:id
/doctors/:id
```

---

## 15. Backend Endpoints

Possible MVP endpoints:

```txt
GET    /api/health

GET    /api/clinics/me
PATCH  /api/clinics/me

GET    /api/doctors
POST   /api/doctors
GET    /api/doctors/:id
PATCH  /api/doctors/:id

GET    /api/patients
POST   /api/patients
GET    /api/patients/:id
PATCH  /api/patients/:id

GET    /api/appointments
POST   /api/appointments
GET    /api/appointments/:id
PATCH  /api/appointments/:id/status

GET    /api/queue/today
PATCH  /api/queue/:id/status

GET    /api/predictions/appointment/:appointmentId
POST   /api/predictions/appointment/:appointmentId/generate

GET    /api/dashboard/summary
```

---

## 16. Data Flow: Create Appointment

```txt
Staff fills appointment form
        ↓
Frontend sends POST /api/appointments
        ↓
Backend validates data
        ↓
Backend checks doctor/clinic relationship
        ↓
Backend checks patient/clinic relationship
        ↓
Backend checks slot availability
        ↓
Backend creates appointment
        ↓
Backend creates queue entry
        ↓
Backend generates no-show prediction
        ↓
Backend returns appointment with queue and prediction
        ↓
Frontend updates UI
```

---

## 17. Data Flow: Update Appointment Status

```txt
Staff clicks status action
        ↓
Frontend sends PATCH request
        ↓
Backend updates appointment status
        ↓
Backend updates queue status if needed
        ↓
Backend updates patient-clinic stats if needed
        ↓
Optional: backend creates status log
        ↓
Frontend refreshes queue/dashboard
```

---

## 18. Data Flow: No-Show Prediction

```txt
Appointment is created
        ↓
Prediction service reads patient-clinic history
        ↓
Prediction service reads appointment details
        ↓
Rules calculate risk score
        ↓
Risk level is assigned
        ↓
Reason and suggested action are generated
        ↓
Prediction is saved in NoShowPrediction table
        ↓
Frontend displays risk badge and suggestion
```

---

## 19. Deployment Architecture

```txt
Frontend → Vercel
Backend → Render
Database → Supabase Postgres / Neon Postgres
Auth → Clerk
```

Environment variables will be used for:

```txt
DATABASE_URL
CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY
CLIENT_URL
SERVER_URL
OPENAI_API_KEY optional
```

---

## 20. Scalability Decisions

Pravaah is MVP-first but SaaS-ready because:

```txt
1. Clinic is a separate entity.
2. Users belong to clinics.
3. Doctors are not locked to one clinic.
4. Patients are not locked to one clinic.
5. DoctorClinic supports multi-clinic doctors.
6. PatientClinic supports multi-clinic patients.
7. Appointment keeps clinic, doctor, and patient relationship clear.
8. QueueEntry separates live flow from scheduled appointment.
9. NoShowPrediction stores AI/risk history.
10. Future doctor and patient login can be added using nullable userId fields.
```

---

## 21. Future Features Supported by Architecture

This architecture can support:

- patient login
- doctor login
- multi-clinic SaaS
- clinic subscription plans
- WhatsApp reminders
- SMS reminders
- email reminders
- AI reminder timing
- patient feedback
- doctor reviews
- clinic reviews
- doctor discovery
- clinic discovery
- appointment analytics
- queue analytics
- no-show prediction accuracy tracking
- patient-clinic relationship analytics
- patient-doctor behavior analytics
- group/family appointments
- doctor availability schedules
- billing and payments

---

## 22. Architecture Non-Negotiables

```txt
1. Do not mix frontend and backend logic.
2. Do not put database logic inside React components.
3. Do not put business logic directly inside routes.
4. Keep services responsible for business rules.
5. Keep repositories responsible for database queries.
6. Keep shared constants/enums reusable.
7. Keep clinicId checks in protected routes/services.
8. Do not build future features before MVP core flow works.
```

---

## 23. Build Order

Recommended build order:

```txt
1. Project setup
2. Authentication
3. Clinic setup
4. Doctor module
5. Patient module
6. Appointment module
7. Queue module
8. Prediction module
9. Dashboard module
10. Deployment
11. Documentation and demo
```

This order prevents chaos.

---

## 24. Final Architecture Summary

Pravaah uses a React frontend, Express backend, PostgreSQL database, Prisma ORM, and Clerk authentication inside a monorepo.

The core architecture is built around this flow:

```txt
Clinic users manage doctors and patients.
Doctors and patients are connected to clinics through relationship tables.
Staff books appointments.
Appointments create queue entries.
Queue entries manage live clinic flow.
No-show predictions warn staff before workflow breaks.
Dashboard summarizes the clinic day.
```

This architecture is simple enough for MVP and strong enough to grow into a SaaS product.
