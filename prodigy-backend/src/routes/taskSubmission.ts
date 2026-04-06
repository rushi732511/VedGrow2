import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';
import {
  createOrUpdateTaskSubmission,
  confirmTaskSubmissionPayment,
  getTaskSubmission,
} from '../services/taskSubmission.service';

const router = Router();

// ─── Validation ───────────────────────────────────────────────────────────────
const urlOptional = z
  .string()
  .url('Must be a valid URL')
  .optional()
  .or(z.literal(''));

const submitSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  task1GithubUrl:   urlOptional,
  task1LinkedinUrl: urlOptional,
  task2GithubUrl:   urlOptional,
  task2LinkedinUrl: urlOptional,
  task3GithubUrl:   urlOptional,
  task3LinkedinUrl: urlOptional,
  task4GithubUrl:   urlOptional,
  task4LinkedinUrl: urlOptional,
});

const verifySchema = z.object({
  applicationId:      z.string().uuid(),
  razorpayOrderId:    z.string().min(1),
  razorpayPaymentId:  z.string().min(1),
  razorpaySignature:  z.string().min(1),
});

// ─── POST /v1/task-submission ─────────────────────────────────────────────────
// Student submits their tasks — returns a Razorpay order to complete payment
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const data = submitSchema.parse(req.body);

    // Convert empty strings to undefined
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? undefined : v])
    ) as typeof data;

    const result = await createOrUpdateTaskSubmission(cleaned);

    res.status(201).json({
      success: true,
      data: result,
    });
  })
);

// ─── POST /v1/task-submission/verify-payment ──────────────────────────────────
// Called by frontend after Razorpay payment widget completes
router.post(
  '/verify-payment',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      applicationId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = verifySchema.parse(req.body);

    // Verify HMAC signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpaySignature)
    );

    if (!isValid) {
      throw new AppError(
        'INVALID_PAYMENT_SIGNATURE',
        'Payment verification failed.',
        400
      );
    }

    const submission = await confirmTaskSubmissionPayment(
      applicationId,
      razorpayPaymentId,
      razorpayOrderId
    );

    res.json({
      success: true,
      data: {
        message: 'Payment confirmed. Your submission is complete!',
        tasksCompleted: submission.tasksCompleted,
        eligibleForCert: submission.eligibleForCert,
        eligibleForLor: submission.eligibleForLor,
      },
    });
  })
);

// ─── GET /v1/task-submission/:applicationId ───────────────────────────────────
// Check if a task submission exists for an application
router.get(
  '/:applicationId',
  asyncHandler(async (req: Request, res: Response) => {
    const { applicationId } = req.params;
    const submission = await getTaskSubmission(applicationId);

    res.json({
      success: true,
      data: { submission },
    });
  })
);

export default router;