import { Router, Request, Response } from 'express';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import prisma from '../../config/db';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, AppErrors } from '../../utils/AppError';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from '../../utils/jwt';
import logger from '../../utils/logger';
import { authenticateAdmin } from '../../middleware/authenticate';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────────────────
const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

// ─── Cookie Config ────────────────────────────────────────────────────────────
const REFRESH_COOKIE_NAME = 'refresh_token';
const refreshCookieOptions = {
    httpOnly: true,       // JS cannot read this cookie — XSS protection
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/v1/admin/auth',           // Cookie only sent to auth endpoints
};

// ─── POST /v1/admin/auth/login ────────────────────────────────────────────────
router.post(
    '/login',
    asyncHandler(async (req: Request, res: Response) => {
        // 1. Validate request body
        const { email, password } = loginSchema.parse(req.body);

        // 2. Find admin user by email
        const admin = await prisma.adminUser.findUnique({
            where: { email },
        });

        // 3. Check user exists AND is active
        // We intentionally use the same error message for both cases —
        // don't tell attackers whether the email exists or not
        if (!admin || !admin.isActive) {
            throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
        }

        // 4. Compare submitted password against stored hash
        const passwordMatch = await compare(password, admin.passwordHash);
        if (!passwordMatch) {
            throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
        }

        // 5. Generate tokens
        const accessToken = generateAccessToken({
            sub: admin.id,
            email: admin.email,
            role: admin.role,
        });

        const refreshToken = generateRefreshToken({ sub: admin.id });

        // 6. Update last login timestamp
        await prisma.adminUser.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
        });

        // 7. Set refresh token as HTTP-only cookie
        res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

        logger.info('Admin login successful', { adminId: admin.id, role: admin.role });

        // 8. Return access token in response body
        res.json({
            success: true,
            data: {
                accessToken,
                admin: {
                    id: admin.id,
                    email: admin.email,
                    fullName: admin.fullName,
                    role: admin.role,
                },
            },
        });
    })
);

// ─── POST /v1/admin/auth/logout ───────────────────────────────────────────────
router.post(
    '/logout',
    asyncHandler(async (_req: Request, res: Response) => {
        // Clear the refresh token cookie
        res.clearCookie(REFRESH_COOKIE_NAME, {
            path: '/v1/admin/auth',
        });

        res.json({
            success: true,
            data: { message: 'Logged out successfully' },
        });
    })
);

// ─── POST /v1/admin/auth/refresh ──────────────────────────────────────────────
router.post(
    '/refresh',
    asyncHandler(async (req: Request, res: Response) => {
        // 1. Read refresh token from cookie
        const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

        if (!token) {
            throw AppErrors.unauthorized();
        }

        // 2. Verify the refresh token
        let payload: { sub: string };
        try {
            payload = verifyRefreshToken(token);
        } catch {
            throw new AppError('INVALID_TOKEN', 'Refresh token is invalid or expired', 401);
        }

        // 3. Confirm admin still exists and is active
        const admin = await prisma.adminUser.findUnique({
            where: { id: payload.sub },
        });

        if (!admin || !admin.isActive) {
            throw AppErrors.unauthorized();
        }

        // 4. Issue new access token
        const accessToken = generateAccessToken({
            sub: admin.id,
            email: admin.email,
            role: admin.role,
        });

        res.json({
            success: true,
            data: { accessToken },
        });
    })
);

// ─── GET /v1/admin/auth/me ────────────────────────────────────────────────────
router.get(
    '/me',
    authenticateAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        // req.admin is guaranteed to exist here — authenticateAdmin ran first
        const admin = await prisma.adminUser.findUnique({
            where: { id: req.admin!.id },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                lastLoginAt: true,
                createdAt: true,
            },
        });

        res.json({
            success: true,
            data: { admin },
        });
    })
);

export default router;