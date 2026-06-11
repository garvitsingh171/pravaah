import type { ErrorRequestHandler } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';

type HttpError = Error & {
    status?: number;
    statusCode?: number;
    type?: string;
    expose?: boolean;
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