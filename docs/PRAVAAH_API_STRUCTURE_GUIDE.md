# Pravaah API Structure Guide

## Purpose

This document explains how backend APIs should be structured in Pravaah.

Use this document when asking any AI assistant, coding tool, or contributor to create or update backend APIs. The goal is to keep all modules consistent, beginner-friendly, and easy to review.

Pravaah uses a feature-module backend structure. Each feature owns its own route, controller, service, repository, validation, and types files.

---

## Core Rule

Every API should follow this flow:

```txt
Route
  -> validateRequest
  -> Controller
  -> Service
  -> Repository
  -> Prisma/PostgreSQL
```

Error flow should be:

```txt
Service throws AppError
  -> Controller passes error using next(error)
  -> Global errorHandler sends JSON error response
```

Do not handle the same error response again and again inside every controller.

---

## Backend Folder Structure

Use this structure for every feature module:

```txt
apps/server/src/
├── config/
│   └── prisma.ts
├── middleware/
│   └── errorHandler.ts
├── modules/
│   ├── clinics/
│   │   ├── clinic.routes.ts
│   │   ├── clinic.controller.ts
│   │   ├── clinic.service.ts
│   │   ├── clinic.repository.ts
│   │   ├── clinic.validation.ts
│   │   └── clinic.types.ts
│   ├── doctors/
│   │   ├── doctor.routes.ts
│   │   ├── doctor.controller.ts
│   │   ├── doctor.service.ts
│   │   ├── doctor.repository.ts
│   │   ├── doctor.validation.ts
│   │   └── doctor.types.ts
│   ├── patients/
│   ├── appointments/
│   ├── queues/
│   └── predictions/
├── utils/
│   ├── AppError.ts
│   └── validateRequest.ts
├── app.ts
└── server.ts
```

Do not create global folders like this:

```txt
routes/
controllers/
services/
repositories/
```

Pravaah should stay feature-module based.

---

## File Responsibility Summary

| File | Responsibility |
| --- | --- |
| `*.routes.ts` | Defines URL, HTTP method, validation middleware, and controller connection. |
| `*.controller.ts` | Reads request data, calls service, sends success response, passes errors to `next(error)`. |
| `*.service.ts` | Contains business rules, checks, and throws `AppError` when rules fail. |
| `*.repository.ts` | Contains only Prisma/database operations. |
| `*.validation.ts` | Contains Zod schemas for body, params, and query validation. |
| `*.types.ts` | Exports TypeScript types inferred from validation schemas. |

---

## Naming Convention

Use singular feature names inside files:

```txt
clinic.routes.ts
clinic.controller.ts
clinic.service.ts
clinic.repository.ts
clinic.validation.ts
clinic.types.ts

doctor.routes.ts
doctor.controller.ts
doctor.service.ts
doctor.repository.ts
doctor.validation.ts
doctor.types.ts
```

Use named exports for routers:

```ts
export { clinicRouter };
export { doctorRouter };
```

Avoid default exports for routers if existing modules use named exports.

---

## API Response Format

### Success Response

Use this format:

```json
{
  "success": true,
  "message": "Clinic created successfully",
  "data": {
    "clinic": {}
  }
}
```

For doctor:

```json
{
  "success": true,
  "message": "Doctor created successfully",
  "data": {
    "doctor": {}
  }
}
```

Do not return this:

```json
{
  "success": true,
  "data": {}
}
```

Prefer wrapping the resource name inside `data`.

---

### Error Response

Use this format:

```json
{
  "success": false,
  "error": {
    "code": "CLINIC_NOT_FOUND",
    "message": "Clinic not found"
  }
}
```

Errors should be created using `AppError` in services and handled by the global `errorHandler`.

---

## Utility: AppError

Create or maintain this file:

### `apps/server/src/utils/AppError.ts`

```ts
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(statusCode: number, code: string, message: string) {
        super(message);

        this.statusCode = statusCode;
        this.code = code;
        this.name = code;

        Object.setPrototypeOf(this, AppError.prototype);
    }
}
```

Use `AppError` only for expected application errors.

Examples:

```ts
throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
throw new AppError(409, 'CLINIC_SLUG_ALREADY_EXISTS', 'Clinic slug already exists');
```

---

## Middleware: Global Error Handler

Create or maintain this file:

### `apps/server/src/middleware/errorHandler.ts`

```ts
import type { ErrorRequestHandler } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';

type HttpError = Error & {
    status?: number;
    statusCode?: number;
    type?: string;
};

export const errorHandler: ErrorRequestHandler = (error: HttpError, _req, res, _next) => {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
            },
        });
        return;
    }

    if (error instanceof SyntaxError && error.status === 400 && error.type === 'entity.parse.failed') {
        res.status(400).json({
            success: false,
            error: {
                code: 'MALFORMED_JSON',
                message: 'Request body contains malformed JSON',
            },
        });
        return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            res.status(409).json({
                success: false,
                error: {
                    code: 'UNIQUE_CONSTRAINT_FAILED',
                    message: 'A record with this value already exists',
                },
            });
            return;
        }

        if (error.code === 'P2025') {
            res.status(404).json({
                success: false,
                error: {
                    code: 'RECORD_NOT_FOUND',
                    message: 'Record not found',
                },
            });
            return;
        }
    }

    console.error(error);

    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong',
        },
    });
};
```

Important rules:

- Register this middleware after all routes.
- Do not register it before routes.
- Controllers that use `next(error)` require this middleware.

---

## Register Routes and Error Handler

In `apps/server/src/app.ts`, register routes first and error handler last.

Example:

```ts
import express from 'express';
import cors from 'cors';
import { clinicRouter } from './modules/clinics/clinic.routes.js';
import { doctorRouter } from './modules/doctors/doctor.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/clinics', clinicRouter);
app.use('/api/clinics', doctorRouter);

app.use(errorHandler);

export { app };
```

If a feature is nested under clinics, mount it under `/api/clinics`.

Example:

```txt
POST /api/clinics/:clinicId/doctors
GET  /api/clinics/:clinicId/doctors
```

The doctor router should then define paths like:

```ts
router.post('/:clinicId/doctors', ...);
router.get('/:clinicId/doctors', ...);
```

Do not define the full `/api` path inside module routes.

---

## Route File Rules

Routes should only contain:

1. Express router creation
2. Validation middleware
3. Controller connection
4. Router export

Routes should not contain:

- Business logic
- Prisma queries
- Error response logic
- Request body parsing logic

### Example: Clinic Routes

```ts
import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { createClinicController, updateClinicController } from './clinic.controller.js';
import { createClinicSchema, updateClinicSchema, clinicIdParamsSchema } from './clinic.validation.js';

const clinicRouter = Router();

clinicRouter.post('/', validateRequest({ body: createClinicSchema }), createClinicController);

clinicRouter.patch(
    '/:clinicId',
    validateRequest({
        params: clinicIdParamsSchema,
        body: updateClinicSchema,
    }),
    updateClinicController
);

export { clinicRouter };
```

### Example: Doctor Routes

```ts
import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { createDoctorController } from './doctor.controller.js';
import { createDoctorSchema, clinicIdParamsSchema } from './doctor.validation.js';

const doctorRouter = Router();

doctorRouter.post(
    '/:clinicId/doctors',
    validateRequest({
        params: clinicIdParamsSchema,
        body: createDoctorSchema,
    }),
    createDoctorController
);

export { doctorRouter };
```

---

## Controller File Rules

Controllers should only do this:

```txt
Read params/body/query
Call service
Send success response
Pass errors to next(error)
```

Controllers should not:

- Query Prisma
- Check database existence directly
- Catch Prisma errors
- Build repeated error responses
- Contain business logic

### Example: Clinic Controller

```ts
import type { Request, Response, NextFunction } from 'express';
import { clinicService } from './clinic.service.js';
import type { CreateClinicInput, UpdateClinicInput } from './clinic.types.js';

export async function createClinicController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const clinicData = req.body as CreateClinicInput;

        const clinic = await clinicService.createClinic(clinicData);

        res.status(201).json({
            success: true,
            message: 'Clinic created successfully',
            data: {
                clinic,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function updateClinicController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as { clinicId: string };
        const clinicData = req.body as UpdateClinicInput;

        const clinic = await clinicService.updateClinic(clinicId, clinicData);

        res.status(200).json({
            success: true,
            message: 'Clinic updated successfully',
            data: {
                clinic,
            },
        });
    } catch (error) {
        next(error);
    }
}
```

### Example: Doctor Controller

```ts
import type { Request, Response, NextFunction } from 'express';
import { doctorService } from './doctor.service.js';
import type { CreateDoctorInput } from './doctor.types.js';

export async function createDoctorController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as { clinicId: string };
        const doctorData = req.body as CreateDoctorInput;

        const doctor = await doctorService.createDoctor(clinicId, doctorData);

        res.status(201).json({
            success: true,
            message: 'Doctor created successfully',
            data: {
                doctor,
            },
        });
    } catch (error) {
        next(error);
    }
}
```

---

## Service File Rules

Services should stay simple.

A service should:

1. Check required business conditions
2. Throw `AppError` when a business rule fails
3. Call repository methods
4. Return repository result

A service should not:

- Contain Prisma query details
- Build response JSON
- Read Express `req` or `res`
- Contain too much try/catch
- Know about HTTP routes

### Simple Service Pattern

```ts
async someOperation(input) {
    const existingThing = await repository.findSomething(input.id);

    if (!existingThing) {
        throw new AppError(404, 'SOMETHING_NOT_FOUND', 'Something not found');
    }

    return repository.doDatabaseWork(input);
}
```

### Example: Clinic Service

```ts
import { AppError } from '../../utils/AppError.js';
import { clinicRepository } from './clinic.repository.js';
import type { CreateClinicInput, UpdateClinicInput } from './clinic.types.js';

export const clinicService = {
    async createClinic(input: CreateClinicInput) {
        const existingClinic = await clinicRepository.findBySlug(input.slug);

        if (existingClinic) {
            throw new AppError(409, 'CLINIC_SLUG_ALREADY_EXISTS', 'Clinic slug already exists');
        }

        return clinicRepository.create(input);
    },

    async updateClinic(clinicId: string, input: UpdateClinicInput) {
        const existingClinic = await clinicRepository.findById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        if (input.slug !== undefined && input.slug !== existingClinic.slug) {
            const clinicWithSameSlug = await clinicRepository.findBySlug(input.slug);

            if (clinicWithSameSlug) {
                throw new AppError(
                    409,
                    'CLINIC_SLUG_ALREADY_EXISTS',
                    'Clinic slug already exists'
                );
            }
        }

        return clinicRepository.update(clinicId, input);
    },
};
```

### Example: Doctor Service

```ts
import { AppError } from '../../utils/AppError.js';
import { doctorRepository } from './doctor.repository.js';
import type { CreateDoctorInput } from './doctor.types.js';

export const doctorService = {
    async createDoctor(clinicId: string, input: CreateDoctorInput) {
        const existingClinic = await doctorRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        return doctorRepository.createDoctorWithClinicLink(clinicId, input);
    },
};
```

Keep services this simple unless the business rule truly needs more.

---

## Repository File Rules

Repositories should only contain Prisma/database operations.

Repositories should:

- Use Prisma client
- Create, read, update, delete database records
- Use transactions when multiple related writes must succeed together
- Map optional input fields to `null` if database columns are nullable

Repositories should not:

- Throw business-specific HTTP errors
- Build response JSON
- Read Express request objects
- Perform route validation

### When to Use Transactions

Use transaction when one API performs multiple related database writes that must succeed together.

Use transaction here:

```txt
Create Doctor
Create DoctorClinic link
```

Because if doctor creation succeeds but linking fails, the database becomes inconsistent.

Do not use transaction for simple one-table operations like clinic create/update unless there are multiple related writes.

### Example: Clinic Repository

```ts
import { prisma } from '../../config/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { CreateClinicInput, UpdateClinicInput } from './clinic.types.js';

export const clinicRepository = {
    findById(id: string) {
        return prisma.clinic.findUnique({
            where: {
                id,
            },
        });
    },

    findBySlug(slug: string) {
        return prisma.clinic.findUnique({
            where: {
                slug,
            },
        });
    },

    create(data: CreateClinicInput) {
        return prisma.clinic.create({
            data: {
                name: data.name,
                slug: data.slug,

                phone: data.phone ?? null,
                email: data.email ?? null,

                addressLine1: data.addressLine1 ?? null,
                addressLine2: data.addressLine2 ?? null,
                city: data.city ?? null,
                state: data.state ?? null,
                country: data.country,
                pincode: data.pincode ?? null,

                timezone: data.timezone,

                openingTime: data.openingTime,
                closingTime: data.closingTime,

                slotDurationMinutes: data.slotDurationMinutes,
                bufferMinutes: data.bufferMinutes,
            },
        });
    },

    update(id: string, data: UpdateClinicInput) {
        const updateData: Prisma.ClinicUpdateInput = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.slug !== undefined) updateData.slug = data.slug;

        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.email !== undefined) updateData.email = data.email;

        if (data.addressLine1 !== undefined) updateData.addressLine1 = data.addressLine1;
        if (data.addressLine2 !== undefined) updateData.addressLine2 = data.addressLine2;
        if (data.city !== undefined) updateData.city = data.city;
        if (data.state !== undefined) updateData.state = data.state;
        if (data.country !== undefined) updateData.country = data.country;
        if (data.pincode !== undefined) updateData.pincode = data.pincode;

        if (data.timezone !== undefined) updateData.timezone = data.timezone;

        if (data.openingTime !== undefined) updateData.openingTime = data.openingTime;
        if (data.closingTime !== undefined) updateData.closingTime = data.closingTime;

        if (data.slotDurationMinutes !== undefined) {
            updateData.slotDurationMinutes = data.slotDurationMinutes;
        }

        if (data.bufferMinutes !== undefined) {
            updateData.bufferMinutes = data.bufferMinutes;
        }

        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        return prisma.clinic.update({
            where: {
                id,
            },
            data: updateData,
        });
    },
};
```

### Example: Doctor Repository

```ts
import { prisma } from '../../config/prisma.js';
import type { CreateDoctorInput } from './doctor.types.js';

export const doctorRepository = {
    findClinicById(id: string) {
        return prisma.clinic.findUnique({
            where: {
                id,
            },
        });
    },

    createDoctorWithClinicLink(clinicId: string, data: CreateDoctorInput) {
        return prisma.$transaction(async (tx) => {
            const doctor = await tx.doctor.create({
                data: {
                    fullName: data.fullName,

                    specialization: data.specialization ?? null,
                    qualification: data.qualification ?? null,
                    registrationNumber: data.registrationNumber ?? null,

                    phone: data.phone ?? null,
                    email: data.email ?? null,

                    gender: data.gender ?? null,
                    experienceYears: data.experienceYears ?? null,

                    isActive: true,
                },
            });

            await tx.doctorClinic.create({
                data: {
                    doctorId: doctor.id,
                    clinicId,
                    isActive: true,
                },
            });

            return doctor;
        });
    },
};
```

---

## Validation File Rules

Use Zod for request validation.

Validation files should contain:

- Body schemas
- Params schemas
- Query schemas if needed
- Types inferred from schemas

Rules:

- Use `.strict()` for request bodies.
- Validate route params separately.
- Use UUID validation for IDs.
- Update schemas should require at least one field.
- Do not perform database checks in validation files.

### Shared UUID Pattern

You can define this inside each validation file for now:

```ts
const uuidSchema = z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'Invalid id'
);
```

Later, this can be moved to a shared validation utility.

### Example: Clinic Validation

```ts
import { z } from 'zod';

const uuidSchema = z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'Invalid id'
);

export const createClinicSchema = z
    .object({
        name: z.string().min(2, 'Clinic name must be at least 2 characters long'),

        slug: z
            .string()
            .min(2, 'Clinic slug must be at least 2 characters long')
            .regex(
                /^[a-z0-9-]+$/,
                'Clinic slug can only contain lowercase letters, numbers, and hyphens'
            ),

        phone: z.string().optional(),
        email: z.string().email('Invalid clinic email').optional(),

        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().default('India'),
        pincode: z.string().optional(),

        timezone: z.string().default('Asia/Kolkata'),

        openingTime: z.string().default('09:00'),
        closingTime: z.string().default('18:00'),

        slotDurationMinutes: z
            .number()
            .int()
            .positive('Slot duration must be a positive number')
            .default(15),

        bufferMinutes: z.number().int().min(0, 'Buffer minutes cannot be negative').default(0),
    })
    .strict();

export type CreateClinicSchemaInput = z.infer<typeof createClinicSchema>;

export const updateClinicSchema = z
    .object({
        name: z.string().min(2, 'Clinic name must be at least 2 characters long').optional(),

        slug: z
            .string()
            .min(2, 'Clinic slug must be at least 2 characters long')
            .regex(
                /^[a-z0-9-]+$/,
                'Clinic slug can only contain lowercase letters, numbers, and hyphens'
            )
            .optional(),

        phone: z.string().optional(),
        email: z.string().email('Invalid clinic email').optional(),

        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),

        timezone: z.string().optional(),

        openingTime: z.string().optional(),
        closingTime: z.string().optional(),

        slotDurationMinutes: z
            .number()
            .int()
            .positive('Slot duration must be a positive number')
            .optional(),

        bufferMinutes: z.number().int().min(0, 'Buffer minutes cannot be negative').optional(),

        isActive: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one clinic field is required for update',
    });

export type UpdateClinicSchemaInput = z.infer<typeof updateClinicSchema>;

export const clinicIdParamsSchema = z.object({
    clinicId: uuidSchema,
});

export type ClinicIdParamsInput = z.infer<typeof clinicIdParamsSchema>;
```

### Example: Doctor Validation

```ts
import { z } from 'zod';

const uuidSchema = z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'Invalid id'
);

export const createDoctorSchema = z
    .object({
        fullName: z.string().min(2, 'Doctor name must be at least 2 characters long'),

        specialization: z.string().optional(),
        qualification: z.string().optional(),
        registrationNumber: z.string().optional(),

        phone: z.string().optional(),

        email: z.string().email('Invalid doctor email').optional(),

        gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),

        experienceYears: z
            .number()
            .int()
            .nonnegative('Experience years cannot be negative')
            .optional(),
    })
    .strict();

export type CreateDoctorSchemaInput = z.infer<typeof createDoctorSchema>;

export const clinicIdParamsSchema = z.object({
    clinicId: uuidSchema,
});

export type ClinicIdParamsInput = z.infer<typeof clinicIdParamsSchema>;
```

---

## Types File Rules

Types should be inferred from Zod schemas.

Do not manually duplicate input types if the schema already defines the shape.

### Clinic Types

```ts
import type { CreateClinicSchemaInput, UpdateClinicSchemaInput } from './clinic.validation.js';

export type CreateClinicInput = CreateClinicSchemaInput;

export type UpdateClinicInput = UpdateClinicSchemaInput;
```

### Doctor Types

```ts
import type { CreateDoctorSchemaInput } from './doctor.validation.js';

export type CreateDoctorInput = CreateDoctorSchemaInput;
```

---

## API Design Rules

Use REST-style URLs.

Good:

```txt
POST  /api/clinics
PATCH /api/clinics/:clinicId
POST  /api/clinics/:clinicId/doctors
GET   /api/clinics/:clinicId/doctors
PATCH /api/clinics/:clinicId/doctors/:doctorId
```

Bad:

```txt
POST /api/createClinic
POST /api/createDoctor
GET  /api/getDoctors
POST /api/doctor/create
```

---

## Clinic and Doctor Relationship Rule

Doctor should not be directly locked to one clinic using only `clinicId` on the `Doctor` model.

Use this relationship:

```txt
Doctor
DoctorClinic
Clinic
```

When creating a doctor for a clinic:

```txt
1. Validate clinicId from params
2. Validate request body
3. Check clinic exists in service
4. Create Doctor
5. Create DoctorClinic link
6. Use transaction for step 4 and 5
```

---

## Beginner-Friendly Rule for Transactions

Use transaction only when one API creates or updates multiple related records.

Examples:

| Operation | Transaction Needed? | Reason |
| --- | --- | --- |
| Create clinic | No | Only one main record is created. |
| Update clinic | No | Only one main record is updated. |
| Create doctor + DoctorClinic link | Yes | Two related records must succeed together. |
| Book appointment + queue entry + prediction | Yes | Multiple workflow records must stay consistent. |

---

## Checklist for Creating a New API

Before writing code, answer:

```txt
1. What is the final endpoint?
2. Which module owns this API?
3. What params need validation?
4. What body needs validation?
5. What business checks are needed?
6. Which database operations are needed?
7. Does this need a transaction?
8. What is the success response shape?
9. What AppErrors can the service throw?
10. How will this be tested in Postman?
```

---

## File-by-File Checklist

### Route

```txt
[ ] Correct endpoint path
[ ] Correct HTTP method
[ ] validateRequest added
[ ] Params validation added if route has params
[ ] Body validation added if route has body
[ ] Correct controller connected
[ ] Router exported using named export
```

### Controller

```txt
[ ] Uses Request, Response, NextFunction
[ ] Reads params/body/query only
[ ] Calls service
[ ] Sends success response
[ ] Uses next(error) in catch block
[ ] Does not contain business logic
[ ] Does not query Prisma
```

### Service

```txt
[ ] Performs business checks
[ ] Throws AppError for expected failures
[ ] Calls repository methods
[ ] Does not use Express req/res
[ ] Does not build JSON response
[ ] Stays readable and simple
```

### Repository

```txt
[ ] Uses Prisma only
[ ] Maps nullable optional fields to null
[ ] Uses transaction only when needed
[ ] Does not throw AppError for normal business checks
[ ] Does not contain request/response logic
```

### Validation

```txt
[ ] Uses Zod
[ ] Body schema uses .strict()
[ ] Params schema validates IDs
[ ] Update schema requires at least one field
[ ] Type is exported using z.infer
```

### Types

```txt
[ ] Imports schema input types
[ ] Exports module input types
[ ] Does not duplicate schema manually
```

---

## Prompt to Give Any AI

Use this prompt when asking an AI to create a new API in Pravaah:

```txt
You are working on Project Pravaah, an Express + TypeScript + Prisma backend.

Follow the existing feature-module API structure exactly.

For each API, create or update these files inside the feature module:
- <feature>.routes.ts
- <feature>.controller.ts
- <feature>.service.ts
- <feature>.repository.ts
- <feature>.validation.ts
- <feature>.types.ts

Use this flow:
Route -> validateRequest -> Controller -> Service -> Repository -> Prisma.

Routes should only define endpoint, validation, and controller.
Controllers should only read request data, call service, send success response, and pass errors using next(error).
Services should contain simple business rules and throw AppError for expected failures.
Repositories should only contain Prisma queries and transactions.
Validation should use Zod, .strict(), and separate params/body schemas.
Types should be inferred from validation schemas.

Use named router exports.
Use REST-style URLs.
Use success response shape:
{
  success: true,
  message: "...",
  data: {
    resourceName: resource
  }
}

Use error response through global errorHandler only.
Do not manually repeat error responses inside controllers.
Do not put Prisma in controllers or services.
Use transactions only when multiple related database writes must succeed together.

For clinic-scoped APIs, mount router under /api/clinics and define nested route paths like /:clinicId/doctors.

Keep the code beginner-friendly and not over-engineered.
```

---

## Final Principle

Keep the API structure boring and consistent.

A good Pravaah backend file should be easy to explain like this:

```txt
Route decides where the request goes.
Validation checks the incoming data.
Controller connects HTTP to service.
Service decides what should happen.
Repository talks to the database.
ErrorHandler sends error responses.
```

That is the style every Pravaah API should follow.
