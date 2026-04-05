import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateAdmin } from '../middleware/authenticate';
import { AppErrors } from '../utils/AppError';
import logger from '../utils/logger';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────────────────
const createContactSchema = z.object({
    fullName: z.string().min(2).max(100),
    email: z.string().email().toLowerCase(),
    phone: z
        .string()
        .regex(/^[+]?[0-9]{10,15}$/)
        .optional(),
    message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

const listContactsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    isResolved: z
        .enum(['true', 'false'])
        .transform((val) => val === 'true')
        .optional(),
});

// ─── POST /v1/contact ─────────────────────────────────────────────────────────
// Public — submit a contact form message
router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        const data = createContactSchema.parse(req.body);

        const submission = await prisma.contactSubmission.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                message: data.message,
            },
        });

        logger.info('Contact form submitted', {
            submissionId: submission.id,
            email: data.email.replace(/(.{2}).+@/, '$1***@'),
        });

        res.status(201).json({
            success: true,
            data: {
                message:
                    'Thank you for reaching out. Our team will get back to you within 24 hours.',
                submissionId: submission.id,
            },
        });
    })
);

// ─── GET /v1/admin/contacts ───────────────────────────────────────────────────
// Admin — list all contact submissions with optional filters
router.get(
    '/admin',
    authenticateAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { page, limit, isResolved } = listContactsSchema.parse(req.query);

        const where: Record<string, unknown> = {};
        if (isResolved !== undefined) where.isResolved = isResolved;

        const skip = (page - 1) * limit;

        const [total, submissions] = await Promise.all([
            prisma.contactSubmission.count({ where }),
            prisma.contactSubmission.findMany({
                where,
                skip,
                take: limit,
                include: {
                    resolver: {
                        select: { fullName: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        res.json({
            success: true,
            data: { submissions },
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    })
);

// ─── PATCH /v1/admin/contacts/:id/resolve ────────────────────────────────────
// Admin — mark a contact submission as resolved
router.patch(
    '/admin/:id/resolve',
    authenticateAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const existing = await prisma.contactSubmission.findUnique({
            where: { id },
        });

        if (!existing) {
            throw AppErrors.notFound('Contact submission');
        }

        if (existing.isResolved) {
            res.json({
                success: true,
                data: { message: 'This submission is already marked as resolved.' },
            });
            return;
        }

        const updated = await prisma.contactSubmission.update({
            where: { id },
            data: {
                isResolved: true,
                resolvedBy: req.admin!.id,
                resolvedAt: new Date(),
            },
        });

        logger.info('Contact submission resolved', {
            submissionId: id,
            resolvedBy: req.admin!.id,
        });

        res.json({
            success: true,
            data: { submission: updated },
        });
    })
);

export default router;