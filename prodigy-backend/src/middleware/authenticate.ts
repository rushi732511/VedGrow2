import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/jwt';
import { AppError, AppErrors } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import prisma from '../config/db';

// ─── authenticateAdmin ────────────────────────────────────────────────────────
// Verifies the JWT access token from the Authorization header.
// On success: attaches admin identity to req.admin and calls next().
// On failure: throws an error caught by the global error handler.

export const authenticateAdmin = asyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
        // 1. Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw AppErrors.unauthorized();
        }

        // "Bearer eyJhbGci..." → "eyJhbGci..."
        const token = authHeader.split(' ')[1];

        if (!token) {
            throw AppErrors.unauthorized();
        }

        // 2. Verify and decode the token
        let payload: { sub: string; email: string; role: string };
        try {
            payload = verifyAccessToken(token);
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                throw new AppError(
                    'TOKEN_EXPIRED',
                    'Access token has expired. Please refresh.',
                    401
                );
            }
            if (error instanceof JsonWebTokenError) {
                throw new AppError(
                    'INVALID_TOKEN',
                    'Access token is invalid.',
                    401
                );
            }
            throw AppErrors.unauthorized();
        }

        // 3. Confirm the admin still exists and is active
        // This catches cases where an admin was deactivated after token was issued
        const admin = await prisma.adminUser.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, isActive: true },
        });

        if (!admin || !admin.isActive) {
            throw AppErrors.unauthorized();
        }

        // 4. Attach admin identity to request object
        req.admin = {
            id: admin.id,
            email: admin.email,
            role: admin.role,
        };

        // 5. Pass control to the next middleware or route handler
        next();
    }
);

// ─── requireSuperAdmin ────────────────────────────────────────────────────────
// Use AFTER authenticateAdmin to restrict a route to super admins only.
// Usage: router.delete('/...', authenticateAdmin, requireSuperAdmin, handler)

export const requireSuperAdmin = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    if (req.admin?.role !== 'SUPER_ADMIN') {
        throw AppErrors.forbidden();
    }
    next();
};