# Questions And Simulations

Authoritative current references: [Interview Guide](../INTERVIEW_GUIDE.md), [Product Requirements](../PRD.md), and [High-Level Design](../HLD.md). Use "Owner input required" for personal or deployment claims the repository cannot prove.

## Likely Questions

**Why Clerk and internal users?**
Clerk handles identity. Internal users store Pravaah-specific role, status, and clinic access.

**Why is unprovisioned identity not a security hole?**
Only onboarding-aware endpoints accept it. Normal operational APIs still require an active internal user.

**Why transactions for onboarding?**
Clinic and first Admin must commit together. Otherwise a failed request could leave an orphan clinic.

**Why no trained ML?**
The project has no real dataset. Rule-based scoring is transparent and honest for an MVP.

**Why no patient or doctor login?**
The project is scoped to clinic-side flow first. Portals would add privacy, permissions, support, and notification concerns.

**How would you scale to multi-clinic access?**
Add a membership table, role per clinic, active clinic selection, and update access checks from `User.clinicId` equality to membership authorization.

## Design Simulation

Question: a signed-up user closes the browser after the clinic/Admin transaction commits but before the frontend receives the response. What happens?

Answer: on retry, the backend should derive that the Clerk identity already has a completed internal user and clinic, then return the completed onboarding response instead of creating duplicates.

## Debug Simulation

Question: public sign-up works, but dashboard returns `INTERNAL_USER_NOT_FOUND`.

Answer: check whether the user completed onboarding. If not, protected routes should redirect to onboarding. If onboarding completed, inspect `User.clerkUserId`, `User.status`, and `User.clinicId` in the development database.

## Tradeoff Simulation

Question: why not let the frontend choose `role=ADMIN` during onboarding?

Answer: role and ownership are authority fields. The backend must assign them from the trusted Clerk identity and transaction result; the frontend can submit only clinic profile fields.
