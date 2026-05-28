# Supabase and Prisma Setup Approach

## Overview

Pravaah will use Supabase PostgreSQL as the hosted database and Prisma as the backend ORM.

This document finalizes the database architecture approach for the MVP. It explains how the backend will connect to Supabase PostgreSQL, how Prisma will be used, how migrations will be handled, how Supabase Auth will fit into the system, and how environment variables will be managed safely.

The goal is to keep the setup practical, secure, beginner-friendly, and maintainable for future developers.

---

## Final Decision

For the MVP, Pravaah will use:

- Supabase PostgreSQL as the primary hosted database
- Prisma ORM for backend database access
- Prisma Migrate for database schema migrations
- Supabase Auth for authentication
- Backend API routes for core business logic and authorization checks

The frontend should use Supabase mainly for authentication. Core application data operations should go through the backend API instead of directly accessing database tables from the frontend.

---

## Why Supabase?

Supabase provides more than just a hosted PostgreSQL database.

It also provides:

- Authentication
- PostgreSQL dashboard
- SQL editor
- Row Level Security
- Storage
- Realtime features
- API layer
- Project settings and database tools

For Pravaah MVP, the most important Supabase features are:

- PostgreSQL database
- Supabase Auth
- Dashboard and SQL editor
- Optional Row Level Security

---

## Why Prisma?

Prisma will be used because it provides:

- Type-safe database queries
- Clear schema modeling
- Migration tracking
- Better developer experience
- Easier collaboration through committed migration files
- Cleaner backend database access

Prisma will act as the main database access layer inside the backend.

---

## High-Level Architecture

```txt
Frontend
   |
   | Login / Signup
   v
Supabase Auth
   |
   | Auth token / user session
   v
Backend API
   |
   | Prisma Client
   v
Supabase PostgreSQL
```
