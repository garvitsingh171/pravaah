# Short Portfolio Case Study

Pravaah is a clinic flow management app for small and medium clinics. It helps authenticated Admin and Staff users move from clinic setup to doctor/patient records, appointment booking, daily queue handling, dashboard review, and explainable rule-based no-show assistance.

## Problem

Clinics often coordinate through notebooks, calls, WhatsApp messages, and disconnected records. That can make appointments, arrivals, queue order, and daily visibility hard to manage. Pravaah focuses on the operational flow around appointments and queues rather than trying to become a full medical records system.

## Solution

The app provides public entry and Clerk authentication, self-service clinic onboarding, Admin clinic settings, doctor and patient records, appointment booking, queue status/reorder tools, dashboard summaries, and deterministic no-show risk explanations.

## Stack

React, TypeScript, Vite, Tailwind CSS, Clerk, Express, Zod, Prisma, PostgreSQL, Vitest, React Testing Library, and npm workspaces.

## Strongest Technical Decisions

- Separate Clerk identity from internal Pravaah authorization.
- Use backend clinic scoping instead of relying only on frontend guards.
- Model `DoctorClinic` and `PatientClinic` relationships for clinic-specific data.
- Wrap appointment creation and queue/risk creation in a transaction.
- Keep no-show assistance deterministic and explainable instead of claiming unsupported ML.

## Current Status

`v0.3.0` is released after owner production verification and GO decision. Production URLs and deployed SHAs are recorded in [Release Identity](../releases/RELEASE_IDENTITY.md); the actual calendar release date and GitHub Release URL are not provided. See [Project Status](../reviewer/project-status.md).

## Challenge

The hardest workflow was coordinating appointment creation with clinic authorization, doctor/patient membership, queue position assignment, no-show risk persistence, and conflict handling without leaving partial records.

## Trade-Off

Pravaah uses deterministic risk rules because they are inspectable and appropriate for a demo/reviewer project. The trade-off is that the system cannot claim trained prediction accuracy or adaptive ML behavior.
