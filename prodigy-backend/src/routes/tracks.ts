import { Router, Request, Response } from 'express';
import prisma from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { AppErrors } from '../utils/AppError';

const router = Router();

// ─── GET /v1/tracks ───────────────────────────────────────────────────────────
// Returns all active internship tracks
// Used by: public website track catalog page
router.get(
    '/',
    asyncHandler(async (_req: Request, res: Response) => {
        const tracks = await prisma.track.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                curriculum: true,
                durationDays: true,
            },
            orderBy: { name: 'asc' },
        });

        res.json({
            success: true,
            data: { tracks },
            meta: { total: tracks.length },
        });
    })
);

// ─── GET /v1/tracks/:slug ─────────────────────────────────────────────────────
// Returns a single track by its slug
// Used by: individual track detail page (e.g. /internships/web-development)
router.get(
    '/:slug',
    asyncHandler(async (req: Request, res: Response) => {
        const { slug } = req.params;

        const track = await prisma.track.findUnique({
            where: { slug, isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                curriculum: true,
                durationDays: true,
            },
        });

        if (!track) {
            throw AppErrors.notFound('Track');
        }

        res.json({
            success: true,
            data: { track },
        });
    })
);

export default router;