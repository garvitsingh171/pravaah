# Architecture Revision

Frontend: `apps/web` is a React/Vite SPA. `App.tsx` owns routes. `ProtectedAppShell` checks signed-in/onboarding state. `ActiveClinicProvider` loads current user/clinic. Feature pages call API helpers through `apiClient`.

Backend: `apps/server` is Express. `app.ts` mounts routers. Feature modules follow route, validation, controller, service, repository, types, tests.

Auth: Clerk proves identity. `authenticateRequest` resolves active internal `User`. `requireClinicAccess`, `requireAdminRole`, and `requireClinicStaffRole` enforce authorization.

Database: Prisma schema targets PostgreSQL. Main models are `Clinic`, `User`, `Doctor`, `DoctorClinic`, `Patient`, `PatientClinic`, `Appointment`, `QueueEntry`, `NoShowPrediction`.

Deployment: frontend Vercel config and backend Node scripts exist. Live deployment proof is not committed.
