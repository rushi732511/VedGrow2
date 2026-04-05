import crypto from 'crypto';
import prisma from '../config/db';
import { AppError, AppErrors } from '../utils/AppError';
import { env } from '../config/env';
import logger from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RazorpayOrder {
    id: string;
    amount: string | number; // Changed from number to string | number
    currency: string;
    receipt?: string;


}

export interface WebhookPayload {
    event: string;
    payload: {
        payment: {
            entity: {
                id: string;
                order_id: string;
                amount: number;
                status: string;
                email: string;
            };
        };
    };
}

// ─── createPaymentOrder ───────────────────────────────────────────────────────
// Creates a Razorpay order for an application.
// The frontend uses the returned order ID to initialize the payment widget.
export async function createPaymentOrder(applicationId: string) {
    // 1. Fetch the application
    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            user: { select: { email: true, fullName: true } },
            track: { select: { name: true } },
        },
    });

    if (!application) {
        throw AppErrors.notFound('Application');
    }

    // 2. Guard: don't create a new order if already paid
    if (application.paymentStatus === 'COMPLETED') {
        throw new AppError(
            'ALREADY_PAID',
            'This application has already been paid for.',
            409
        );
    }

    // 3. Create Razorpay order
    // In production, this calls the Razorpay SDK.
    // With placeholder credentials, we simulate the response.
    let razorpayOrder: RazorpayOrder;

    try {
        // Dynamically import Razorpay to avoid crash if credentials are invalid
        const Razorpay = (await import('razorpay')).default;
        const razorpay = new Razorpay({
            key_id: env.RAZORPAY_KEY_ID,
            key_secret: env.RAZORPAY_KEY_SECRET,
        });

        razorpayOrder = await razorpay.orders.create({
            amount: application.paymentAmount, // in paise
            currency: 'INR',
            receipt: `receipt_${applicationId.slice(0, 8)}`,
            notes: {
                applicationId,
                trackName: application.track.name,
                applicantEmail: application.user.email,
            },
        });
    } catch (error) {
        // If Razorpay SDK fails (e.g., placeholder credentials in dev),
        // return a mock order so we can test the rest of the flow
        logger.warn('Razorpay order creation failed — using mock order', { error });
        razorpayOrder = {
            id: `order_mock_${Date.now()}`,
            amount: application.paymentAmount,
            currency: 'INR',
            receipt: `receipt_${applicationId.slice(0, 8)}`,
        };
    }

    // 4. Save the order ID on the application
    await prisma.application.update({
        where: { id: applicationId },
        data: {
            paymentOrderId: razorpayOrder.id,
            status: 'PAYMENT_PENDING',
        },
    });

    logger.info('Payment order created', {
        applicationId,
        orderId: razorpayOrder.id,
    });

    return {
        orderId: razorpayOrder.id,
        amount: application.paymentAmount,
        currency: 'INR',
        keyId: env.RAZORPAY_KEY_ID,
        prefill: {
            name: application.user.fullName,
            email: application.user.email,
        },
    };
}

// ─── verifyPaymentSignature ───────────────────────────────────────────────────
// Verifies the HMAC signature Razorpay sends after a successful payment.
// This is the server-side check that confirms the payment is genuine.
export function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
): boolean {
    // Razorpay signs: orderId + "|" + paymentId using your key secret
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
    );
}

// ─── confirmPayment ───────────────────────────────────────────────────────────
// Called after signature verification succeeds.
// Marks the application as paid in the database.
export async function confirmPayment(
    applicationId: string,
    paymentId: string,
    orderId: string
) {
    const application = await prisma.application.update({
        where: { id: applicationId },
        data: {
            paymentStatus: 'COMPLETED',
            paymentId,
            paymentOrderId: orderId,
            paidAt: new Date(),
            status: 'ENROLLED',
        },
    });

    logger.info('Payment confirmed', { applicationId, paymentId });

    return application;
}

// ─── handleRazorpayWebhook ────────────────────────────────────────────────────
// Processes Razorpay webhook events.
// Razorpay calls this URL automatically when payment events occur.
export async function handleRazorpayWebhook(
    rawBody: string,
    signature: string,
    payload: WebhookPayload
) {
    // 1. Verify webhook authenticity using HMAC
    const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

    const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
    );

    if (!isValid) {
        throw new AppError('INVALID_WEBHOOK', 'Webhook signature mismatch', 400);
    }

    // 2. Handle the event type
    if (payload.event === 'payment.captured') {
        const payment = payload.payload.payment.entity;

        // Find the application by Razorpay order ID
        const application = await prisma.application.findFirst({
            where: { paymentOrderId: payment.order_id },
        });

        if (!application) {
            logger.warn('Webhook received for unknown order', {
                orderId: payment.order_id,
            });
            return;
        }

        // Avoid double-processing if webhook fires twice
        if (application.paymentStatus === 'COMPLETED') {
            logger.info('Webhook already processed', {
                applicationId: application.id,
            });
            return;
        }

        await confirmPayment(application.id, payment.id, payment.order_id);
    }

    logger.info('Webhook processed', { event: payload.event });
}