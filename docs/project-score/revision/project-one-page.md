# One-Page Project Revision

Problem: small and medium clinics often manage appointments, arrivals, waiting order, and no-show risk through disconnected tools.

Users: Admin and Staff authenticate with Clerk. Doctors and patients are operational records, not logged-in users.

Stack: React, TypeScript, Vite, Express, Clerk, Prisma, PostgreSQL, Zod, Vitest/RTL.

Architecture: browser React app calls Express JSON APIs with Clerk Bearer token. Backend resolves internal active `User`, role, and clinic access before controllers. Services enforce workflow rules; repositories use Prisma/PostgreSQL.

Core workflows: onboarding creates clinic and first Admin; doctor/patient management creates clinic links; appointment booking creates appointment, queue entry, and deterministic risk prediction; queue page supports status updates and manual doctor-scoped reorder; dashboard summarizes clinic-day operations.

Database: `Clinic`, `User`, `Doctor`, `DoctorClinic`, `Patient`, `PatientClinic`, `Appointment`, `QueueEntry`, `NoShowPrediction`.

Strongest decisions: backend authorization, relational join tables, appointment transaction, queue reorder validation, deterministic explainable risk assistance, human-controlled decisions.

Limitations: no trained ML/LLM, no MongoDB, no patient/doctor login, no browser E2E, no verified production URLs in repo, broad non-final status transitions, no full multi-clinic user membership.
