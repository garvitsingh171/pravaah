# Pravaah

Pravaah is an AI-assisted clinic flow management system that helps small clinics manage appointments, reduce no-shows, and optimize daily patient queues.

## AI-Assisted Clinic Flow Management System

> **Pravaah means “flow”.**  
> This project is designed to make the daily flow of a clinic smoother, smarter, and less stressful.

---

## 1. What is Pravaah?

Pravaah is a web application for small and medium-sized clinics.

Many clinics still manage appointments using notebooks, phone calls, WhatsApp messages, and manual reminders. This creates confusion when patients arrive late, miss appointments, cancel suddenly, or show up without proper scheduling.

Pravaah helps clinics manage:

- doctors
- patients
- appointments
- daily queues
- no-show risk
- staff actions
- clinic workflow

The main goal is simple:

> Help clinics reduce patient no-shows, reduce waiting time, and use doctor time better.

---

## 2. Explain Pravaah Like I Am 5 Years Old

Imagine a doctor has 10 people waiting.

Some people come on time.  
Some people come late.  
Some people do not come at all.

Now everyone gets confused.

The doctor waits.  
Patients wait.  
The receptionist keeps calling people.  
The whole clinic becomes messy.

Pravaah is like a smart helper for the clinic.

It tells the staff:

- who has an appointment today
- who has arrived
- who is late
- who may not come
- who should go next
- what action the staff should take

So the clinic day runs smoothly.

---

## 3. Problem Statement

Small clinics often lose valuable time because appointment management is still manual.

Common problems include:

- patients forget appointments
- patients arrive late
- patients cancel without informing
- some patients never show up
- doctors sit idle during empty slots
- staff repeatedly calls patients
- waiting patients become frustrated
- clinic revenue is affected
- the daily queue becomes disorganized

Pravaah is built to solve this operational problem.

---

## 4. Final Project Pitch

> **Pravaah is an AI-assisted clinic flow management system that reduces patient no-shows, minimizes waiting time, and helps clinics operate in a smoother and more organized way.**

---

## 5. Who is Pravaah For?

Pravaah is mainly for:

- small clinics
- medium-sized clinics
- individual doctors
- reception staff
- clinic administrators
- clinics that still depend on manual appointment management

The first version is focused on clinic-side users, not patient-side users.

---

## 6. Why This Project Matters

Most student projects are simple CRUD apps such as:

- task managers
- expense trackers
- note apps
- chat apps

Pravaah is different because it solves a real-world workflow problem.

It demonstrates:

- product thinking
- healthcare workflow understanding
- database design
- role-based system thinking
- appointment scheduling
- queue management
- AI-assisted decision support
- SaaS-ready architecture

---

## 7. MVP Goal

The goal is to release a working MVP by **12 July 2026**.

The MVP will allow a clinic admin or staff member to:

1. log in
2. manage clinic profile
3. add doctors
4. add patients
5. book appointments
6. view today’s queue
7. update appointment status
8. see no-show risk prediction
9. get staff action suggestions
10. view a simple dashboard

---

## 8. Core User Flow

```txt
Clinic Admin / Staff logs in
        ↓
Creates or manages clinic profile
        ↓
Adds doctors
        ↓
Adds patients
        ↓
Books appointment for a patient with a doctor
        ↓
Appointment enters the daily queue
        ↓
System generates no-show risk prediction
        ↓
Staff sees today's queue and risk alerts
        ↓
Staff marks patient as arrived, late, completed, no-show, or cancelled
        ↓
Dashboard updates clinic flow status
```

---

## 9. Main Features

### 9.1 Authentication

Clinic-side users can log in securely.

MVP roles:

- Admin
- Staff

Future roles:

- Doctor
- Patient
- Super Admin

---

### 9.2 Clinic Management

The clinic can store basic details such as:

- clinic name
- address
- city
- phone
- email
- opening time
- closing time
- slot duration
- buffer time

---

### 9.3 Doctor Management

The clinic can add and manage doctors.

Doctor details include:

- name
- phone
- email
- gender
- specialization
- qualification
- experience
- availability

A doctor can work in multiple clinics in the future.

---

### 9.4 Patient Management

The clinic can add and manage patients.

Patient details include:

- name
- phone
- email
- age
- gender
- address
- city
- emergency contact

A patient can visit multiple clinics in the future.

---

### 9.5 Appointment Management

Staff can book appointments for patients.

Appointment details include:

- clinic
- doctor
- patient
- date and time
- duration
- reason for visit
- notes
- status
- booking source

MVP appointment statuses:

- Scheduled
- Arrived
- Completed
- Late
- No-show
- Cancelled

---

### 9.6 Queue Management

Pravaah maintains a live queue for the clinic day.

Appointment is the planned schedule.  
Queue is what is happening right now.

Example:

```txt
Original appointments:
10:00 AM - Patient A
10:15 AM - Patient B
10:30 AM - Patient C

If Patient B is late, live queue may become:
Patient A
Patient C
Patient B
```

This is the main difference between Pravaah and a normal appointment booking app.

---

### 9.7 AI No-Show Risk Assistant

Pravaah will predict whether a patient has a low, medium, or high chance of missing an appointment.

The prediction may use:

- previous no-shows
- previous late arrivals
- distance from clinic
- appointment time
- patient type
- appointment history

Example output:

```txt
Risk Level: High
Risk Score: 82/100
Reason: Patient has missed previous appointments and lives far from the clinic.
Suggested Action: Call patient before the appointment and keep a backup patient ready.
```

For MVP, this can start as a rule-based prediction system. Later, AI can be used to generate smarter explanations and suggestions.

---

### 9.8 Dashboard

The dashboard will show:

- total appointments today
- completed appointments
- no-show appointments
- high-risk appointments
- current queue
- upcoming appointments

---

## 10. Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Backend

- Node.js
- Express.js
- TypeScript

### Database

- PostgreSQL
- Prisma ORM

### Authentication

- Clerk

### AI

- Rule-based prediction for first MVP
- OpenAI API integration can be added after core system is stable

### Deployment

- Frontend: Vercel
- Backend: Render
- Database: Supabase Postgres

### Repository Strategy

- Monorepo
- npm workspaces

---

## 11. Repository Structure

```txt
pravaah/
├── client/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middlewares/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   └── package.json
│
├── shared/
│   ├── types/
│   ├── constants/
│   └── index.ts
│
├── docs/
│   ├── MVP.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── USER_ROLES.md
│   └── ROADMAP.md
│
├── README.md
├── package.json
├── package-lock.json
└── .gitignore
```

---

## 12. Why Monorepo?

Pravaah uses a monorepo because the frontend, backend, and shared code belong to one product.

Benefits:

- one GitHub repository
- easier project management
- frontend and backend stay together
- shared types can be reused
- easier for AI tools and GitHub Copilot to understand the whole project
- easier for a solo developer to manage

---

## 13. Current Development Status

Current phase:

```txt
Planning and Architecture
```

Coding starts only after the planning documents are finalized.

---

## 14. Success Criteria

Pravaah MVP will be considered successful if by 12 July 2026:

- the app is deployed
- clinic admin/staff can log in
- doctors can be added
- patients can be added
- appointments can be booked
- today’s queue can be managed
- appointment statuses can be updated
- no-show risk is generated
- staff action suggestions are shown
- dashboard gives useful clinic overview
- README and technical documentation are complete
- demo data and demo video are available

---

## 15. Future Vision

After MVP, Pravaah can grow into a SaaS product with:

- patient login
- doctor login
- WhatsApp reminders
- SMS reminders
- email reminders
- AI reminder timing
- doctor discovery
- clinic discovery
- rating and reviews
- patient feedback
- doctor availability system
- subscription billing
- analytics dashboard
- waiting time prediction
- smart queue rearrangement
- emergency patient prioritization
- regional language support
- online consultation support

---

## 16. Project Philosophy

Pravaah is not being built as a feature-heavy project.

It is being built as a focused product.

The first goal is not to build everything.

The first goal is to solve one painful problem well:

> Make clinic appointment flow smoother and smarter.
