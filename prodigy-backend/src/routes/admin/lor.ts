import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../config/db';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticateAdmin } from '../../middleware/authenticate';
import { AppErrors } from '../../utils/AppError';
import { sendLorEmail } from '../../services/email.service';
import logger from '../../utils/logger';

const router = Router();
router.use(authenticateAdmin);

// ─── POST /v1/admin/lor/:applicationId/send ───────────────────────────────────
// Send Letter of Recommendation email for a specific application
router.post(
  '/:applicationId/send',
  asyncHandler(async (req: Request, res: Response) => {
    const { applicationId } = req.params;

    // Get the application with all needed data
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: true,
        track: { select: { name: true } },
        certificate: { select: { cin: true } },
        taskSubmission: {
          select: { eligibleForLor: true, tasksCompleted: true },
        },
      },
    });

    if (!application) {
      throw AppErrors.notFound('Application');
    }

    if (!application.taskSubmission?.eligibleForLor) {
      throw new (await import('../../utils/AppError')).AppError(
        'NOT_ELIGIBLE_FOR_LOR',
        'This applicant has not completed 4 tasks and is not eligible for a LoR.',
        400
      );
    }

    if (!application.certificate?.cin) {
      throw new (await import('../../utils/AppError')).AppError(
        'NO_CERTIFICATE',
        'Generate and activate the certificate before sending a LoR.',
        400
      );
    }

    // Send LoR email with PDF attachment
    sendLorEmail(
      application.user.email,
      application.user.fullName,
      application.track.name,
      application.certificate.cin,
      application.user.collegeName ?? undefined
    ).catch((err) =>
      logger.error('Failed to send LoR email', { applicationId, error: err })
    );

    res.json({
      success: true,
      data: {
        message: `Letter of Recommendation email queued for ${application.user.fullName}.`,
      },
    });
  })
);

// ─── GET /v1/admin/lor/eligible ───────────────────────────────────────────────
// List applications eligible for LoR (4+ tasks, payment complete)
router.get(
  '/eligible',
  asyncHandler(async (_req: Request, res: Response) => {
    const eligible = await prisma.application.findMany({
      where: {
        taskSubmission: {
          eligibleForLor: true,
          paymentStatus: 'COMPLETED',
        },
        status: 'COMPLETED',
      },
      include: {
        user: { select: { fullName: true, email: true, collegeName: true } },
        track: { select: { name: true } },
        certificate: { select: { cin: true, isActivated: true } },
        taskSubmission: {
          select: {
            tasksCompleted: true,
            eligibleForLor: true,
            paidAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { applications: eligible },
      meta: { total: eligible.length },
    });
  })
);

export default router;