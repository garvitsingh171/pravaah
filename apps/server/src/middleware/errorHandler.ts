import type { ErrorRequestHandler } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import { isTransientDatabaseError } from '../utils/databaseRetry.js';

type HttpError = Error & {
    code?: string;
    status?: number;
    statusCode?: number;
    type?: string;
    expose?: boolean;
};

const sendDatabaseUnavailable = (res: Parameters<ErrorRequestHandler>[2]): void => {
    res.status(503).json({
        success: false,
        error: {
            code: 'DATABASE_TRANSACTION_UNAVAILABLE',
            message: 'The database is temporarily unavailable. Please try again.',
        },
    });
};

const sendDatabaseSchemaUnavailable = (res: Parameters<ErrorRequestHandler>[2]): void => {
    res.status(503).json({
        success: false,
        error: {
            code: 'DATABASE_SCHEMA_OUTDATED',
            message: 'The service is being updated. Please try again shortly.',
        },
    });
};

export const errorHandler: ErrorRequestHandler = (error: HttpError, req, res, _next) => {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                ...(error.details ? { details: error.details } : {}),
            },
        });
        return;
    }

    if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        error.type === 'entity.parse.failed'
    ) {
        res.status(400).json({
            success: false,
            error: {
                code: 'MALFORMED_JSON',
                message: 'Request body contains malformed JSON',
            },
        });
        return;
    }

    if (error.status === 401 || error.statusCode === 401) {
        const hasAuthorizationHeader = Boolean(req.header('authorization'));

        res.status(401).json({
            success: false,
            error: {
                code: hasAuthorizationHeader ? 'INVALID_AUTH_TOKEN' : 'AUTHENTICATION_REQUIRED',
                message: hasAuthorizationHeader
                    ? 'Authentication token is invalid or expired'
                    : 'Authentication is required',
            },
        });
        return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2024' || error.code === 'P2028' || error.code === 'P2034') {
            sendDatabaseUnavailable(res);
            return;
        }

        if (error.code === 'P2021' || error.code === 'P2022') {
            sendDatabaseSchemaUnavailable(res);
            return;
        }

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

    if (error instanceof Prisma.PrismaClientInitializationError) {
        sendDatabaseUnavailable(res);
        return;
    }

    if (isTransientDatabaseError(error)) {
        sendDatabaseUnavailable(res);
        return;
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
