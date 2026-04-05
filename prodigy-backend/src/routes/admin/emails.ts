import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../config/db';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticateAdmin } from '../../middleware/authenticate';

const router = Router();
router.use(authenticateAdmin);

// GET /v1/admin/emails — list email logs with filters
router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        const schema = z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            status: z.enum(['QUEUED', 'SENT', 'FAILED', 'BOUNCED']).optional(),
            templateName: z.string().optional(),
        });

        const { page, limit, status, templateName } = schema.parse(req.query);
        const where: Record<string, unknown> = {};

        if (status) where.status = status;
        if (templateName) where.templateName = templateName;

        const skip = (page - 1) * limit;

        const [total, logs] = await Promise.all([
            prisma.emailLog.count({ where }),
            prisma.emailLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        res.json({
            success: true,
            data: { logs },
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    })
);

export default router;