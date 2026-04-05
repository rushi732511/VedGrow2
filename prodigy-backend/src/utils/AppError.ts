/**
 * Custom error class for all known, expected errors in the application.
 *
 * Instead of throwing generic `new Error('something failed')`, we throw
 * `new AppError('DUPLICATE_APPLICATION', 'You already applied this month', 400)`
 *
 * This gives every error a machine-readable code, human-readable message,
 * and an HTTP status code — all in one place.
 */
export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(code: string, message: string, statusCode: number = 400) {
        super(message);

        this.code = code;
        this.statusCode = statusCode;

        // Operational errors are expected failures (duplicate application, invalid
        // CIN, wrong password). Non-operational are programmer mistakes (null
        // pointer, etc.) — we handle them differently in the error handler.
        this.isOperational = true;

        // Maintains proper stack trace in V8 (Node.js)
        Error.captureStackTrace(this, this.constructor);
    }
}

// ─── Common Error Factories ───────────────────────────────────────────────────
// Convenience functions for errors we'll throw frequently.
// Usage: throw AppErrors.notFound('Application');

export const AppErrors = {
    notFound: (resource: string) =>
        new AppError('NOT_FOUND', `${resource} not found`, 404),

    unauthorized: () =>
        new AppError('UNAUTHORIZED', 'Authentication required', 401),

    forbidden: () =>
        new AppError('FORBIDDEN', 'You do not have permission to perform this action', 403),

    duplicate: (message: string) =>
        new AppError('DUPLICATE', message, 409),

    validation: (message: string) =>
        new AppError('VALIDATION_ERROR', message, 422),

    internal: () =>
        new AppError('INTERNAL_ERROR', 'An unexpected error occurred', 500),
};