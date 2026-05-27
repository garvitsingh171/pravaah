# Pravaah MVP Scope

## Target Release Date

**12 July 2026**

## Daily Work Capacity

The MVP is planned according to a realistic solo-developer schedule.

Available time:

```txt
3 to 4 hours daily
From 1 June 2026 to 12 July 2026
```

This means the MVP must stay focused. The goal is not to build every possible healthcare feature. The goal is to release a stable, useful, and explainable product by the deadline.

---

## 1. MVP One-Line Definition

> **Pravaah is an AI-assisted clinic flow management system that helps small clinics manage appointments, reduce patient no-shows, and optimize daily patient queues.**

---

## 2. MVP Problem Statement

Small clinics often depend on notebooks, calls, WhatsApp, and manual coordination to manage appointments.

This creates problems when:

- patients arrive late
- patients miss appointments
- patients cancel suddenly
- staff does not know who should go next
- doctors sit idle
- patients wait too long
- empty slots are wasted
- clinic operations become stressful

The MVP solves this by creating a digital appointment and queue management system with AI-assisted no-show risk suggestions.

---

## 3. MVP Target Users

### Primary Users

#### Clinic Admin

The clinic owner, manager, or main person responsible for managing the clinic inside Pravaah.

Can:

- log in
- manage clinic profile
- add doctors
- add patients
- book appointments
- manage queue
- view dashboard
- see AI suggestions

#### Receptionist / Staff

The person who handles daily appointment and patient flow.

Can:

- add patients
- book appointments
- update appointment status
- mark patients as arrived, late, completed, no-show, or cancelled
- view queue
- view no-show risk

### MVP Non-Login Users

#### Doctor

Doctor exists as a profile/entity in the system, but does not log in during MVP.

Future version can allow doctor login.

#### Patient

Patient exists as a profile/entity in the system, but does not log in during MVP.

Future version can allow patient login.

---

## 4. MVP Core User Flow

```txt
Admin or Staff logs in
        ↓
Clinic profile exists
        ↓
Staff adds doctors
        ↓
Staff adds patients
        ↓
Staff books appointment
        ↓
Appointment enters daily queue
        ↓
System generates no-show risk
        ↓
Staff views queue and risk level
        ↓
Staff updates appointment status during clinic day
        ↓
Dashboard updates with useful summary
```

Everything in MVP should support this flow.

If a feature does not support this flow, it is not part of MVP.

---

## 5. MVP Features

## 5.1 Authentication

### Must Have

- Login for clinic-side users
- Protected dashboard routes
- Authenticated API access

### Roles in MVP

```txt
ADMIN
STAFF
```

### Future Roles

```txt
DOCTOR
PATIENT
SUPER_ADMIN
```

### Technical Decision

Use **Clerk** for authentication.

Reason:

- faster to implement
- secure by default
- avoids wasting time on custom auth
- lets the project focus on core clinic workflow

---

## 5.2 Clinic Profile

### Must Have

A clinic should have basic information:

- clinic name
- slug
- address
- city
- state
- country
- pincode
- phone
- email
- timezone
- opening time
- closing time
- slot duration
- buffer time
- active status

### Why This Matters

Pravaah is designed to become SaaS-ready later.

A clinic is not the same as a user.

Example:

```txt
Clinic: Mehta Dental Clinic
User: Ramesh, the clinic admin
Doctor: Dr. Mehta
Patient: Garvit Singh
```

---

## 5.3 Doctor Management

### Must Have

Clinic staff can:

- add doctor
- view doctors
- update doctor details
- mark doctor as available/unavailable

### Doctor Fields

- name
- phone
- email
- gender
- specialization
- registration number
- qualification
- experience years
- profile photo URL
- active status

### SaaS-Ready Relationship

Doctors are not locked to one clinic.

A doctor can work in many clinics using the `DoctorClinic` relationship.

---

## 5.4 Patient Management

### Must Have

Clinic staff can:

- add patient
- view patients
- update patient details
- view basic patient history

### Patient Fields

- name
- phone
- email
- age
- gender
- date of birth
- address
- city
- state
- pincode
- emergency contact name
- emergency contact phone

### SaaS-Ready Relationship

Patients are not locked to one clinic.

A patient can visit many clinics using the `PatientClinic` relationship.

---

## 5.5 Patient-Clinic Relationship

### Must Have

For every clinic-patient relationship, store clinic-specific patient data:

- patient type
- distance from clinic
- total appointments
- total no-shows
- total late arrivals
- last visit date
- clinic-specific notes

### Patient Types

```txt
REGULAR
FIRST_TIME
WALK_IN
REFERRED
```

### Why This Matters

A patient may behave differently with different clinics.

Example:

```txt
Same patient at Clinic A: always on time
Same patient at Clinic B: missed 2 appointments
```

So behavior should be tracked per clinic.

---

## 5.6 Appointment Management

### Must Have

Clinic staff can:

- book appointment
- view appointments
- filter appointments by date
- filter appointments by doctor
- update appointment status
- cancel appointment

### Appointment Fields

- clinic
- doctor
- patient
- optional group
- scheduled date/time
- duration
- status
- appointment type
- booking source
- reason for visit
- notes
- cancellation details
- reschedule reference
- created by user

### MVP Appointment Statuses

```txt
SCHEDULED
ARRIVED
COMPLETED
LATE
NO_SHOW
CANCELLED
```

### Future Appointment Statuses

```txt
CONFIRMED
IN_QUEUE
IN_PROGRESS
RESCHEDULED
SKIPPED
```

### Appointment Types

```txt
CONSULTATION
FOLLOW_UP
EMERGENCY
```

### Booking Sources

```txt
RECEPTION
PHONE_CALL
WEBSITE
WHATSAPP
PATIENT_APP
```

For MVP, most appointments will be created by reception/staff.

---

## 5.7 Queue Management

### Must Have

Staff can view and manage today’s queue.

Queue should show:

- patient name
- doctor name
- scheduled time
- current position
- queue status
- estimated start time
- actual start time
- completion time

### Queue Statuses

```txt
WAITING
IN_PROGRESS
COMPLETED
SKIPPED
NO_SHOW
```

### Why Queue Is Separate From Appointment

Appointment means:

```txt
What was planned?
```

Queue means:

```txt
What is happening right now?
```

Example:

A patient had an appointment at 10:15 AM. But they arrived late. The original appointment should not be destroyed. The live queue can still be adjusted.

This is what makes Pravaah a clinic flow management system, not just an appointment booking app.

---

## 5.8 AI No-Show Risk Assistant

### Must Have

For every appointment, Pravaah should generate a no-show risk prediction.

Risk levels:

```txt
LOW
MEDIUM
HIGH
```

Risk score:

```txt
0 to 100
```

Prediction output should include:

- risk level
- risk score
- reason
- suggested staff action
- factors used
- model/rule version

### Example

```txt
Risk Level: HIGH
Risk Score: 82
Reason: Patient has missed 2 previous appointments and lives far from the clinic.
Suggested Action: Call patient 2 hours before appointment and keep a backup patient ready.
```

### MVP AI Strategy

Use a two-stage approach.

#### Stage 1: Rule-Based Prediction

Example rules:

```txt
If total no-shows >= 2 → HIGH risk
If distance from clinic > 10 km and evening slot → MEDIUM risk
If patient has late arrival history → MEDIUM risk
Otherwise → LOW risk
```

#### Stage 2: AI-Generated Explanation

After the core system works, AI can generate better human-readable explanations and staff suggestions.

This keeps the MVP practical and stable.

---

## 5.9 Dashboard

### Must Have

Dashboard should show:

- today’s total appointments
- completed appointments
- late appointments
- no-show appointments
- high-risk appointments
- current waiting queue
- upcoming appointments

### Should Have

- simple cards
- filters by date
- filters by doctor
- risk summary

---

## 5.10 Basic Documentation

### Must Have

The project should include:

- README.md
- MVP.md
- ARCHITECTURE.md
- DATABASE_DESIGN.md
- USER_ROLES.md
- ROADMAP.md
- SETUP.md

---

## 6. Must-Have Features for July 12

These features must be completed for MVP release:

```txt
1. Authentication for admin/staff
2. Clinic profile setup
3. Doctor creation and listing
4. Patient creation and listing
5. Doctor-clinic relationship
6. Patient-clinic relationship
7. Appointment booking
8. Appointment listing
9. Appointment status update
10. Queue creation from appointment
11. Today’s queue screen
12. No-show risk prediction
13. Staff action suggestion
14. Dashboard summary
15. Basic filters
16. Deployment
17. Documentation
18. Demo data
```

---

## 7. Should-Have Features

These should be built if time allows:

```txt
1. Appointment detail page
2. Patient history view
3. Doctor availability toggle
4. Appointment filters by risk level
5. Better loading and empty states
6. Basic charts
7. Appointment group support
8. Appointment status log
```

---

## 8. Could-Have Features

These are nice but not necessary for MVP:

```txt
1. AI reminder message generator
2. Advanced analytics
3. Export appointments as CSV
4. Patient search by phone number
5. Doctor-wise appointment stats
6. Manual queue reordering
```

---

## 9. Out of Scope for July 12

These features will not be built before July 12:

```txt
1. Patient mobile app
2. Patient login
3. Doctor login
4. Real WhatsApp integration
5. Real SMS integration
6. Online payments
7. Billing and invoicing
8. Medical records
9. Prescription management
10. GPS tracking
11. Real traffic API
12. Real weather API
13. SaaS subscription billing
14. Multi-branch enterprise hospital management
15. Video consultation
16. Rating and review system
17. Doctor/clinic recommendation engine
```

Reason:

The available time is 3 to 4 hours daily. Adding these features now will damage the MVP.

---

## 10. MVP Success Criteria

The MVP is successful if by 12 July 2026:

```txt
1. App is deployed and publicly accessible
2. Admin/staff can log in
3. Clinic can manage doctors
4. Clinic can manage patients
5. Clinic can book appointments
6. Appointments create queue entries
7. Staff can update appointment status
8. Queue screen shows daily clinic flow
9. No-show risk is generated for appointments
10. Staff action suggestions are visible
11. Dashboard gives meaningful daily summary
12. Database is PostgreSQL with Prisma
13. Documentation explains the project clearly
14. Demo data is available
15. Demo video/screenshots are ready
```

---

## 11. MVP Timeline

## Planning Phase

### May 23 to May 24

Goal:

```txt
Finalize project scope, user roles, architecture, and database design.
```

Tasks:

- write README.md
- write MVP.md
- write ARCHITECTURE.md
- write DATABASE_DESIGN.md
- write USER_ROLES.md
- finalize entities
- finalize relationships
- finalize folder structure
- create GitHub issues/project board

---

## Week 1: June 1 to June 7

Goal:

```txt
Set up project foundation.
```

Tasks:

- create monorepo
- setup client with React + TypeScript + Vite
- setup Tailwind CSS
- setup shadcn/ui
- setup server with Express + TypeScript
- setup Prisma
- setup PostgreSQL
- create initial schema
- setup Clerk authentication
- protect basic routes

---

## Week 2: June 8 to June 14

Goal:

```txt
Build doctor and patient management.
```

Tasks:

- doctor API
- doctor UI
- doctor-clinic relationship
- patient API
- patient UI
- patient-clinic relationship
- basic search/listing
- validation

---

## Week 3: June 15 to June 21

Goal:

```txt
Build appointment management.
```

Tasks:

- appointment API
- appointment booking UI
- appointment list UI
- prevent duplicate slots
- appointment status update
- filter by doctor/date/status
- connect appointment to doctor/patient/clinic

---

## Week 4: June 22 to June 28

Goal:

```txt
Build queue and no-show prediction.
```

Tasks:

- create queue entry from appointment
- today’s queue API
- queue UI
- queue status update
- rule-based prediction service
- no-show prediction table
- risk badge in UI
- suggested staff action

---

## Week 5: June 29 to July 5

Goal:

```txt
Build dashboard and polish user flow.
```

Tasks:

- dashboard stats API
- dashboard UI
- high-risk appointments card
- upcoming appointments card
- queue summary
- error states
- loading states
- empty states
- seed demo data

---

## Week 6: July 6 to July 12

Goal:

```txt
Deploy, test, document, and release.
```

Tasks:

- deploy backend
- deploy frontend
- connect production URLs
- test full flow
- fix bugs
- finalize README
- finalize documentation
- add screenshots
- record demo video
- create release notes

---

## 12. MVP Engineering Priorities

Priority order:

```txt
1. Correct database design
2. Working appointment flow
3. Working queue flow
4. Working no-show risk system
5. Clean dashboard
6. Deployment
7. Polish
```

Do not reverse this order.

A beautiful UI with broken data flow is not a good MVP.

---

## 13. MVP Non-Negotiables

These rules should not be broken:

```txt
1. No random feature additions before core flow is complete.
2. No patient login before clinic-side flow is complete.
3. No custom auth before MVP.
4. No real WhatsApp/SMS integration before MVP.
5. No advanced analytics before queue and appointments work.
6. No styling perfectionism before functionality.
7. No AI obsession before database and workflow are stable.
```

---

## 14. MVP Final Deliverable

By 12 July 2026, Pravaah should be a deployed clinic dashboard where a mentor, interviewer, or user can understand and test the main value:

> A clinic can manage daily appointments, see patient queue, identify risky no-shows, and take better action before the clinic workflow breaks.
