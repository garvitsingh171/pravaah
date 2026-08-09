# Resume-Ready Summary

## Project Summary

Built Pravaah, a clinic flow management app for Admin and Staff users to manage clinic setup, doctors, patients, appointments, daily queues, dashboard visibility, and explainable rule-based no-show assistance using React, TypeScript, Express, Prisma, PostgreSQL, and Clerk.

## Evidence-Based Bullets

- Implemented clinic-scoped authentication and authorization by separating Clerk identity from internal `User` role, status, and clinic access checks.
- Built self-service clinic onboarding that transactionally creates a clinic and first active Admin user.
- Developed appointment booking with clinic/doctor/patient membership validation, same-time doctor conflict checks, queue-entry creation, and deterministic no-show risk persistence.
- Implemented daily queue workflows with status synchronization, terminal-state protection, and manual reorder for active doctor/date queues.
- Modeled relational clinic operations with `Clinic`, `User`, `DoctorClinic`, `PatientClinic`, `Appointment`, `QueueEntry`, and `NoShowPrediction`.
- Added backend and frontend automated tests for critical auth, onboarding, appointment, queue, dashboard, prediction, routing, and UI behavior where coverage exists.
- Created reviewer-facing documentation, workflow traces, evidence maps, release-readiness docs, and honest limitation tracking.

## One-Paragraph Summary

Pravaah is a TypeScript clinic flow management app for small and medium clinics, built with React, Express, Prisma, PostgreSQL, and Clerk. It supports Admin/Staff authentication, clinic onboarding, doctor and patient records, appointment booking, daily queue management, dashboard summaries, and deterministic no-show risk explanations while keeping patient/doctor portals, trained ML, notifications, and full multi-clinic SaaS membership as future work.
