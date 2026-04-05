import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticateAdmin } from '../../middleware/authenticate';
import {
    createBatch,
    getBatches,
    getBatchById,
    assignApplicationsToBatch,
    updateBatchStatus,
    sendOfferLetters,
    sendTaskForms,
} from '../../services/batch.service';
const router = Router();

// All routes in this file require admin authentication
router.use(authenticateAdmin);

// ─── Validation Schemas ───────────────────────────────────────────────────────
const createBatchSchema = z.object({
    trackId: z.string().uuid('Invalid track ID'),
    startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

const assignSchema = z.object({
    applicationIds: z
        .array(z.string().uuid())
        .min(1, 'At least one application ID is required'),
});

const statusSchema = z.object({
    status: z.enum(['OPEN', 'ACTIVE', 'COMPLETED']),
});

// ─── GET /v1/admin/batches ────────────────────────────────────────────────────
router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        const { status, trackId } = req.query as {
            status?: string;
            trackId?: string;
        };

        const batches = await getBatches({ status, trackId });

        res.json({
            success: true,
            data: { batches },
            meta: { total: batches.length },
        });
    })
);

// ─── POST /v1/admin/batches ───────────────────────────────────────────────────
router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        const data = createBatchSchema.parse(req.body);
        const batch = await createBatch(data);

        res.status(201).json({
            success: true,
            data: { batch },
        });
    })
);

// ─── GET /v1/admin/batches/:id ────────────────────────────────────────────────
router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const batch = await getBatchById(req.params.id);

        res.json({
            success: true,
            data: { batch },
        });
    })
);

// ─── PATCH /v1/admin/batches/:id/status ──────────────────────────────────────
router.patch(
    '/:id/status',
    asyncHandler(async (req: Request, res: Response) => {
        const { status } = statusSchema.parse(req.body);
        const batch = await updateBatchStatus(req.params.id, status);

        res.json({
            success: true,
            data: { batch },
        });
    })
);

// ─── POST /v1/admin/batches/:id/assign ───────────────────────────────────────
// Assigns one or more applications to this batch
router.post(
    '/:id/assign',
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationIds } = assignSchema.parse(req.body);
        await assignApplicationsToBatch(req.params.id, applicationIds);

        res.json({
            success: true,
            data: {
                message: `${applicationIds.length} application(s) assigned to batch successfully.`,
            },
        });
    })
);

// ─── POST /v1/admin/batches/:id/offer-letters ─────────────────────────────────
// Sends offer letter emails to all enrolled applicants in the batch
router.post(
    '/:id/offer-letters',
    asyncHandler(async (req: Request, res: Response) => {
        const result = await sendOfferLetters(req.params.id);

        res.json({
            success: true,
            data: {
                message: `Offer letters processed. Sent: ${result.sent}, Failed: ${result.failed ?? 0}.`,
                ...result,
            },
        });
    })
);

// ─── POST /v1/admin/batches/:id/task-forms ────────────────────────────────────
// Sends task submission form emails to eligible applicants in the batch
router.post(
    '/:id/task-forms',
    asyncHandler(async (req: Request, res: Response) => {
        const { submissionFormUrl } = z
            .object({
                submissionFormUrl: z.string().url('Must be a valid URL'),
            })
            .parse(req.body);

        const result = await sendTaskForms(req.params.id, submissionFormUrl);

        res.json({
            success: true,
            data: {
                message: `Task forms processed. Sent: ${result.sent}, Failed: ${result.failed}.`,
                ...result,
            },
        });
    })
);

export default router;