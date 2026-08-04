# Revision Cheatsheet

Authoritative current references: [Interview Guide](../INTERVIEW_GUIDE.md), [Product Requirements](../PRD.md), and [High-Level Design](../HLD.md).

## Project

Pravaah is clinic-side flow management for Admin and Staff users.

## Stack

React, Vite, TypeScript, Express, Prisma, PostgreSQL, Clerk, Tailwind, Vitest.

## Core Flow

```txt
Public entry -> Clerk -> onboarding -> clinic/Admin -> doctors/patients -> appointment -> queue -> dashboard
```

## Key Security Point

Clerk identity is not Pravaah authorization. Normal APIs require an active internal user and clinic access.

## Key Data Point

Clinic onboarding creates `Clinic` and first `ADMIN` `User` in one transaction.

## No-Show Point

Rule-based, advisory, stored with reasons and suggested actions. Not trained ML.

## Current Release Line

`v0.2.0` is a release candidate. Tests, builds, deployment checks, and screenshots must be verified before final release.

## Non-Goals

No patient login, doctor login, billing, prescriptions, inventory, trained ML, communication automation, or full multi-clinic SaaS.
