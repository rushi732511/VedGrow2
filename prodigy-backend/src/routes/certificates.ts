import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateAdmin } from '../middleware/authenticate';
import {
    verifyCertificate,
    generateCertificate,
    bulkGenerateCertificates,
    activateCertificate,
    getCertificates,
} from '../services/certificate.service';
import { AppErrors } from '../utils/AppError';

const router = Router();

// ─── PUBLIC ROUTES (no auth) ──────────────────────────────────────────────────

// GET /v1/certificates/verify?cin=PI-250201-A3K9Q
router.get(
    '/verify',
    asyncHandler(async (req: Request, res: Response) => {
        const cin = req.query.cin as string | undefined;

        if (!cin) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CIN',
                    message: 'Please provide a CIN to verify.',
                },
            });
            return;
        }

        const result = await verifyCertificate(cin);

        // CIN not found at all
        if (!result) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'INVALID_CIN',
                    message: 'Invalid CIN. Please check and try again.',
                },
            });
            return;
        }

        // Certificate exists but not yet activated
        if (result.status === 'pending') {
            res.status(200).json({
                success: false,
                error: {
                    code: 'CERTIFICATE_PENDING',
                    message:
                        'This certificate has not been issued yet. Certificates are sent after the batch end date.',
                },
            });
            return;
        }

        // Valid activated certificate
        res.json({
            success: true,
            data: result,
        });
    })
);

// ─── ADMIN ROUTES (auth required) ────────────────────────────────────────────

// GET /v1/admin/certificates
router.get(
    '/admin',
    authenticateAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const schema = z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            isActivated: z
                .enum(['true', 'false'])
                .transform((val) => val === 'true')
                .optional(),
            trackId: z.string().uuid().optional(),
        });

        const { page, limit, isActivated, trackId } = schema.parse(req.query);

        const result = await getCertificates({ page, limit, isActivated, trackId });

        res.json({
            success: true,
            data: { certificates: result.certificates },
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: result.totalPages,
            },
        });
    })
);

// POST /v1/admin/certificates/generate
// Generate certificate for a single application
router.post(
    '/admin/generate',
    authenticateAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationId } = z
            .object({ applicationId: z.string().uuid() })
            .parse(req.body);

        const certificate = await generateCertificate(applicationId);

        res.status(201).json({
            success: true,
            data: { certificate },
        });
    })
);

// POST /v1/admin/certificates/bulk-generate
// Generate certificates for multiple applications at once
router.post(
    '/admin/bulk-generate',
    authenticateAdmin,
    asyncHandler(async (req: Request, res: Response) => {
        const { applicationIds } = z
            .object({
                applicationIds: z.array(z.string().uuid()).min(1).max(100),
            })
            .parse(req.body);

        const results = await bulkGenerateCertificates(applicationIds);

        res.json({
            success: true,
            data: results,
        });
    })
);

// POST /v1/admin/certificates/:cin/activate
// Activate a certificate (called after email is sent)
// POST /v1/admin/certificates/activate
router.post(
  '/admin/activate',
  authenticateAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { cin } = z.object({ cin: z.string().min(1) }).parse(req.body);
    const certificate = await activateCertificate(cin);

        res.json({
            success: true,
            data: { certificate },
        });
    })
);

export default router;