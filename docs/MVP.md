<!--
Pravaah documentation package
Generated for Project Pravaah on June 1, 2026.
Locked stack: React + TypeScript, Express + TypeScript, Clerk, Neon PostgreSQL, Prisma.
-->

# Pravaah MVP Scope

## 1. Purpose

This document defines the MVP boundary for Pravaah.

The purpose is to prevent scope creep. Pravaah has a strong long-term vision, but the first release must stay focused enough to build, test, deploy, and explain clearly.

This document should answer:

- what is included in the MVP
- what is not included in the MVP
- who the MVP is for
- what the first AI-assisted feature is
- what success looks like
- what comes after the MVP

## 2. MVP one-line definition

Pravaah MVP is a clinic-side appointment and queue management system with starter AI-assisted no-show risk scoring.

## 3. Product problem

Small and medium clinics often manage appointments using notebooks, phone calls, WhatsApp messages, or disconnected records.

This creates problems such as:

- missed appointments
- late patient arrivals
- unused doctor time
- long waiting queues
- confused reception staff
- poor visibility into the clinic day
- revenue loss due to empty slots

The real problem is not only that patients miss appointments.

The real problem is:

> The entire clinic workflow gets disturbed when appointment flow is not managed properly.

## 4. MVP goal

Build a working clinic-side system that lets Admin and Staff users:

- sign in securely
- manage clinic profile data
- manage doctors
- manage patients
- book and update appointments
- view and manage today's queue
- see starter no-show risk for appointments

## 5. MVP users

The MVP has only clinic-side authenticated users.

| User    | MVP Status        | Meaning                                                        |
| ------- | ----------------- | -------------------------------------------------------------- |
| Admin   | Included          | Clinic owner/manager/operator with higher permissions.         |
| Staff   | Included          | Reception/operations user who manages appointments and queues. |
| Patient | Not authenticated | Exists as a record, but does not log in.                       |
| Doctor  | Not authenticated | Exists as a record, but does not log in.                       |

## 6. Locked stack

| Layer            | MVP Choice              |
| ---------------- | ----------------------- |
| Frontend         | React + TypeScript      |
| Backend          | Express + TypeScript    |
| Authentication   | Clerk                   |
| Database hosting | Neon PostgreSQL         |
| ORM              | Prisma                  |
| Repository       | npm workspaces monorepo |

Supabase is not part of the MVP architecture.

## 7. MVP feature list

### 7.1 Authentication

MVP includes:

- Clerk-based sign-in for Admin and Staff
- backend verification of authenticated requests
- protected frontend routes
- role-aware backend checks

MVP does not include:

- custom password system
- patient login
- doctor login
- multi-factor auth customization

### 7.2 Clinic management

MVP includes:

- create or store clinic profile
- edit clinic contact and location details
- store opening and closing time
- store slot duration and buffer settings
- use clinic as the operational boundary for appointments and queues

Clinic fields may include:

- name
- slug
- phone
- email
- address
- city/state/country/pincode
- timezone
- opening time
- closing time
- slot duration
- buffer minutes
- active status

### 7.3 Doctor management

MVP includes:

- create doctor profile
- edit doctor details
- activate/deactivate doctor record
- link doctor to clinic through `DoctorClinic`
- filter appointments and queue by doctor

Important modeling decision:

> Doctor is not directly locked to one clinic. The relationship between Doctor and Clinic is handled through DoctorClinic.

### 7.4 Patient management

MVP includes:

- create patient profile
- edit patient contact and identity details
- link patient to clinic through `PatientClinic`
- maintain clinic-specific patient history such as total appointments, no-shows, and late arrivals

Important modeling decision:

> Patient is not directly locked to one clinic. The relationship between Patient and Clinic is handled through PatientClinic.

### 7.5 Appointment management

MVP includes:

- book appointment for a clinic, doctor, and patient
- validate doctor-clinic and patient-clinic relationship
- prevent obvious slot conflicts
- update appointment status
- filter appointments by date, doctor, patient, and status
- store reason and notes

Common appointment statuses:

- scheduled
- confirmed
- arrived
- in queue
- called
- completed
- cancelled
- no-show

### 7.6 Queue management

MVP includes:

- show today's live queue
- create or display queue entries for the day
- update queue status
- show appointment, doctor, patient, and risk information
- allow staff to manage queue order manually when needed

Queue management must remain human-controlled in MVP.

The system can assist staff, but it must not automatically cancel or reorder appointments without staff action.

### 7.7 Starter no-show risk prediction

MVP includes one AI-assisted feature:

> Starter No-Show Risk Prediction

For MVP, this can be rule-based and explainable.

The system can calculate a risk score using factors such as:

- previous no-shows
- previous late arrivals
- total appointment count
- distance from clinic
- same-day booking
- appointment timing
- patient history inside the clinic

Example output:

```txt
Risk Score: 72/100
Risk Level: High
Reasons:
- Patient has previous no-shows
- Patient has previous late arrivals
- Patient lives far from the clinic
```

This is enough for MVP because it creates a real AI-assisted workflow without pretending to be a full machine-learning product.

### 7.8 Basic dashboard

MVP includes:

- today's appointments count
- waiting queue count
- completed appointment count
- cancelled/no-show count
- simple operational overview
- visible high-risk appointments if available

The dashboard should be useful, not decorative.

## 8. Main MVP workflow

```txt
Admin/Staff signs in
        ↓
Clinic setup exists
        ↓
Staff adds doctor
        ↓
Doctor is linked to clinic
        ↓
Staff adds patient
        ↓
Patient is linked to clinic
        ↓
Staff books appointment
        ↓
System generates starter no-show risk
        ↓
Appointment appears in appointment list and queue flow
        ↓
Staff updates status during the clinic day
        ↓
Queue reflects current operational state
```

## 9. MVP non-goals

Do not build these during the MVP:

- patient login
- doctor login
- billing
- inventory
- prescriptions
- medical records
- hospital management system
- advanced analytics
- WhatsApp automation
- SMS/email/voice reminder automation
- live patient location tracking
- weather-based prediction
- traffic-based prediction
- trained machine-learning model
- automatic appointment cancellation
- fully automatic queue reordering
- multi-branch SaaS admin dashboard
- mobile application

These can become post-MVP features only after the core system works.

## 10. MVP acceptance criteria

The MVP is acceptable when:

- Admin or Staff can sign in.
- Backend verifies authenticated requests.
- Admin can manage clinic profile information.
- Admin or Staff can create doctors.
- Admin or Staff can create patients.
- Doctors and patients can be linked to clinics.
- Admin or Staff can book appointments.
- Appointment creation validates doctor-clinic and patient-clinic relationship.
- Appointment status can be updated.
- Today's queue can be viewed.
- Queue status can be changed by staff.
- A starter no-show risk score can be generated and displayed.
- Core docs match implementation.
- The app can be deployed or prepared for deployment.

## 11. MVP success metrics

For a student project, success should be measured by clarity and completeness, not fake scale.

Good MVP success metrics:

- Can a new user understand the product in 2 minutes?
- Can staff complete the appointment booking flow without confusion?
- Can queue status be updated cleanly?
- Can no-show risk be explained clearly?
- Is the database model sensible for future growth?
- Can the project be explained in an internship interview?
- Can the repo be reviewed by another developer without confusion?

## 12. Demo scenario

Use this scenario for demos and testing:

1. Admin signs in.
2. Admin creates clinic profile for "Dr. Mehta's Clinic".
3. Staff adds one doctor.
4. Staff adds multiple patients.
5. Staff books appointments for today.
6. System generates no-show risk for each appointment.
7. Staff opens today's queue.
8. One patient arrives late.
9. Staff updates queue status manually.
10. Dashboard reflects current appointment and queue state.

## 13. Post-MVP direction

After the MVP, Pravaah can grow into:

- advanced ML-based no-show prediction
- notification reminders
- WhatsApp/SMS/email integrations
- doctor availability scheduling
- patient portal
- doctor portal
- analytics dashboard
- audit logs
- multi-clinic SaaS workflows
- location-aware arrival prediction
- traffic/weather-based risk adjustment
- emergency prioritization
- online consultation support

## 14. MVP principle

Do not build everything.

Build the core workflow:

```txt
Clinic → Doctor/Patient → Appointment → Queue → Starter Prediction
```

That is the spine of Pravaah.
