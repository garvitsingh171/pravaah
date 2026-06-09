import type { Request, RequestHandler } from 'express';
import type { ZodIssue, ZodTypeAny } from 'zod';

type RequestValidationSource = 'body' | 'params' | 'query';

export type RequestValidationSchemas = Partial<Record<RequestValidationSource, ZodTypeAny>>;

export type ValidationErrorDetail = {
    field: string;
    message: string;
};

const formatValidationErrors = (
    source: RequestValidationSource,
    issues: ZodIssue[]
): ValidationErrorDetail[] => {
    return issues.map((issue) => ({
        field: issue.path.length > 0 ? `${source}.${issue.path.map(String).join('.')}` : source,
        message: issue.message,
    }));
};

const assignParsedData = (req: Request, source: RequestValidationSource, data: unknown): void => {
    if (source === 'body') {
        req.body = data;
        return;
    }

    if (source === 'params') {
        req.params = data as Request['params'];
    }
};

/**
 * Reusable request validation middleware.
 *
 * Example usage inside a future feature module:
 *
 * router.post(
 *   "/clinics/:clinicId/appointments",
 *   validateRequest({
 *     params: z.object({
 *       clinicId: z.string().uuid(),
 *     }),
 *     body: z.object({
 *       patientId: z.string().uuid(),
 *       doctorId: z.string().uuid(),
 *       scheduledAt: z.string().datetime(),
 *     }),
 *   }),
 *   createAppointmentController,
 * );
 */
export const validateRequest = (schemas: RequestValidationSchemas): RequestHandler => {
    return (req, res, next) => {
        const validationErrors: ValidationErrorDetail[] = [];

        const validationTargets: {
            source: RequestValidationSource;
            schema: ZodTypeAny | undefined;
            value: unknown;
        }[] = [
            {
                source: 'params',
                schema: schemas.params,
                value: req.params,
            },
            {
                source: 'query',
                schema: schemas.query,
                value: req.query,
            },
            {
                source: 'body',
                schema: schemas.body,
                value: req.body,
            },
        ];

        for (const target of validationTargets) {
            if (!target.schema) {
                continue;
            }

            const result = target.schema.safeParse(target.value);

            if (!result.success) {
                validationErrors.push(
                    ...formatValidationErrors(target.source, result.error.issues)
                );
                continue;
            }

            assignParsedData(req, target.source, result.data);
        }

        if (validationErrors.length > 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data.',
                    details: validationErrors,
                },
            });
            return;
        }

        next();
    };
};
