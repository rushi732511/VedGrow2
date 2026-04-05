import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import {
    createPaymentOrder,
    verifyPaymentSignature,
    confirmPayment,
    handleRazorpayWebhook,
} from '../services/payment.service';
import { AppError } from '../utils/AppError';

const router = Router();

// ─── POST /v1/applications/:id/payment ───────────────────────────────────────
// Creates a Razorpay order for the given application.
// Frontend uses the returned data to open the Razorpay payment widget.
router.post(
    '/applications/:id/payment',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const order = await createPaymentOrder(id);

        res.status(201).json({
            success: true,
            data: order,
        });
    })
);

// ─── POST /v1/applications/:id/payment/verify ─────────────────────────────────
// Called by the frontend after the user completes payment in the Razorpay widget.
// Verifies the payment signature and marks the application as paid.
const verifySchema = z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
});

router.post(
    '/applications/:id/payment/verify',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
            verifySchema.parse(req.body);

        // Verify the HMAC signature
        const isValid = verifyPaymentSignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        if (!isValid) {
            throw new AppError(
                'INVALID_PAYMENT_SIGNATURE',
                'Payment verification failed. Please contact support.',
                400
            );
        }

        // Mark application as paid
        await confirmPayment(id, razorpayPaymentId, razorpayOrderId);

        res.json({
            success: true,
            data: { message: 'Payment verified successfully. Welcome aboard!' },
        });
    })
);

// ─── POST /v1/webhooks/razorpay ───────────────────────────────────────────────
// Razorpay calls this URL automatically for payment events.
// IMPORTANT: uses raw body (not parsed JSON) for signature verification.
router.post(
    '/webhooks/razorpay',
    asyncHandler(async (req: Request, res: Response) => {
        const signature = req.headers['x-razorpay-signature'] as string;

        if (!signature) {
            throw new AppError('MISSING_SIGNATURE', 'Webhook signature missing', 400);
        }

        // req.body is the raw string here (configured in server.ts)
        const rawBody = typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body);

        const payload = typeof req.body === 'string'
            ? JSON.parse(req.body)
            : req.body;

        await handleRazorpayWebhook(rawBody, signature, payload);

        // Always respond 200 quickly — Razorpay retries if we don't
        res.json({ success: true });
    })
);

export default router;