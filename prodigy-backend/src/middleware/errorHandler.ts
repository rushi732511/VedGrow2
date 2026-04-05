import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import { isDev } from '../config/env';

/**
 * Global error handling middleware.
 * Must be registered LAST in server.ts (after all routes).
 * Express identifies this as an error handler because it has 4 parameters.
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction // must be declared even if unused
): void {
    // ── Zod Validation Errors ──────────────────────────────────────────────────
    // Zod throws ZodError when input fails schema validation.
    // We convert it into a clean list of field-level errors.
    if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));

        res.status(422).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details,
            },
        });
        return;
    }

    // ── Known Operational Errors ───────────────────────────────────────────────
    // AppError is thrown intentionally by our services for expected failures.
    // We trust its statusCode and message — safe to send to client.
    if (err instanceof AppError && err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
        return;
    }

    // ── Unknown / Unexpected Errors ────────────────────────────────────────────
    // Something we didn't anticipate — a bug, a crashed DB query, etc.
    // Log the full error internally but never expose details to the client.
    logger.error('Unhandled error', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            // Only show stack trace in development — never in production
            ...(isDev && { stack: err.stack }),
        },
    });
}