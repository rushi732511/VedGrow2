import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../config/db';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticateAdmin } from '../../middleware/authenticate';
import { AppErrors } from '../../utils/AppError';
import { assignApplicationsToBatch } from '../../services/batch.service';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// ─── Validation Schemas ───────────────────────────────────────────────────────
const listQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z
        .enum(['SUBMITTED', 'PAYMENT_PENDING', 'ENROLLED', 'COMPLETED', 'WITHDRAWN'])
        .optional(),
    paymentStatus: z
        .enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'])
        .optional(),
    trackId: z.string().uuid().optional(),
    batchId: z.string().uuid().optional(),
    search: z.string().optional(), // search by name or email
});

const updateApplicationSchema = z.object({
    status: z
        .enum(['SUBMITTED', 'PAYMENT_PENDING', 'ENROLLED', 'COMPLETED', 'WITHDRAWN'])
        .optional(),
    notes: z.string().optional(),
    taskSubmittedAt: z.string().datetime().optional(),
});

const bulkActionSchema = z.object({
    applicationIds: z.array(z.string().uuid()).min(1),
    action: z.enum(['assign_batch', 'mark_completed', 'mark_withdrawn']),
    batchId: z.string().uuid().optional(), // required when action is assign_batch
});

// ─── GET /v1/admin/applications ───────────────────────────────────────────────
// Paginated list with filters and search
router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        const query = listQuerySchema.parse(req.query);
        const { page, limit, status, paymentStatus, trackId, batchId, search } =
            query;

        // Build dynamic where clause
        const where: Record<string, unknown> = {};

        if (status) where.status = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;
        if (trackId) where.trackId = trackId;
        if (batchId) where.batchId = batchId;

        // Search across user name and email
        if (search) {
            where.user = {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        // Calculate pagination offset
        const skip = (page - 1) * limit;

        // Run count and data fetch in parallel for performance
        const [total, applications] = await Promise.all([
            prisma.application.count({ where }),
            prisma.application.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            phone: true,
                        },
                    },
                    track: {
                        select: { id: true, name: true, slug: true },
                    },
                    batch: {
                        select: {
                            id: true,
                            startDate: true,
                            endDate: true,
                            status: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        res.json({
            success: true,
            data: { applications },
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    })
);

// ─── GET /v1/admin/applications/:id ──────────────────────────────────────────
router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const application = await prisma.application.findUnique({
            where: { id: req.params.id },
            include: {
                user: true,
                track: true,
                batch: true,
                certificate: {
                    select: {
                        id: true,
                        cin: true,
                        issuedDate: true,
                        isActivated: true,
                        certificateUrl: true,
                    },
                },
            },
        });

        if (!application) {
            throw AppErrors.notFound('Application');
        }

        res.json({
            success: true,
            data: { application },
        });
    })
);

// ─── PATCH /v1/admin/applications/:id ────────────────────────────────────────
// Update application status or notes
router.patch(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const data = updateApplicationSchema.parse(req.body);

        const existing = await prisma.application.findUnique({
            where: { id: req.params.id },
        });

        if (!existing) {
            throw AppErrors.notFound('Application');
        }

        const updated = await prisma.application.update({
            where: { id: req.params.id },
            data: {
                ...(data.status && { status: data.status }),
                ...(data.notes !== undefined && { notes: data.notes }),
                ...(data.taskSubmittedAt && {
                    taskSubmittedAt: new Date(data.taskSubmittedAt),
                }),
            },
            include: {
                user: { select: { id: true, fullName: true, email: true } },
                track: { select: { id: true, name: true } },
            },
        });

        res.json({
            success: true,
            data: { application: updated },
        });
    })
);

// ─── POST /v1/admin/applications/bulk-action ──────────────────────────────────
// Perform an action on multiple applications at once
router.post(
    '/bulk-action',
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationIds, action, batchId } = bulkActionSchema.parse(
            req.body
        );

        switch (action) {
            case 'assign_batch': {
                if (!batchId) {
                    throw new (await import('../../utils/AppError')).AppError(
                        'MISSING_BATCH_ID',
                        'batchId is required for assign_batch action.',
                        400
                    );
                }
                await assignApplicationsToBatch(batchId, applicationIds);
                break;
            }

            case 'mark_completed': {
                await prisma.application.updateMany({
                    where: { id: { in: applicationIds } },
                    data: { status: 'COMPLETED' },
                });
                break;
            }

            case 'mark_withdrawn': {
                await prisma.application.updateMany({
                    where: { id: { in: applicationIds } },
                    data: { status: 'WITHDRAWN' },
                });
                break;
            }
        }

        res.json({
            success: true,
            data: {
                message: `Action '${action}' applied to ${applicationIds.length} application(s).`,
            },
        });
    })
);

export default router;