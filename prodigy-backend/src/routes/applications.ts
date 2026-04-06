import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { createApplication } from '../services/application.service';

const router = Router();

// ─── Validation Schema ────────────────────────────────────────────────────────
const createApplicationSchema = z.object({
    fullName: z
        .string()
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name is too long'),
    email: z
        .string()
        .email('Please enter a valid email address')
        .toLowerCase(),
    phone: z
        .string()
        .regex(
            /^[+]?[0-9]{10,15}$/,
            'Please enter a valid phone number (10-15 digits)'
        ),
    trackSlug: z
        .string()
        .min(1, 'Please select an internship track'),

    // Extended profile fields — optional but stored
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    collegeName: z.string().max(200).optional(),
    highestQualification: z.string().max(100).optional(),
    passingYear: z.string().optional(),
    country: z.string().max(100).optional(),
    joinedSocials: z.boolean().optional(),
});
// ─── POST /v1/applications ────────────────────────────────────────────────────
// Submit a new internship application
router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        // 1. Validate request body — throws ZodError if invalid
        const validatedData = createApplicationSchema.parse(req.body);

        // 2. Run business logic in the service
        const { user, application } = await createApplication(validatedData);

        // 3. Return success response
        res.status(201).json({
            success: true,
            data: {
                applicationId: application.id,
                status: application.status,
                track: application.track,
                applicant: {
                    name: user.fullName,
                    email: user.email,
                },
            },
        });
    })
);

// ─── GET /v1/applications/:id ─────────────────────────────────────────────────
// Get application details by ID
// Used by: payment flow (frontend needs application data to init payment)
router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        // Basic UUID format check before hitting the DB
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'Invalid application ID format',
                },
            });
            return;
        }

        const { getApplicationById } = await import(
            '../services/application.service'
        );
        const application = await getApplicationById(id);

        res.json({
            success: true,
            data: { application },
        });
    })
);

export default router;