import prisma from '../config/db';
import { AppError, AppErrors } from '../utils/AppError';
import logger from '../utils/logger';
import { sendOfferLetter, sendTaskSubmissionForm } from './email.service';
import { env } from '../config/env';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CreateBatchDTO {
    trackId: string;
    startDate: string; // ISO date string e.g. "2025-02-01"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Validates that a date falls on the 1st or 15th of any month
function isValidBatchStartDate(date: Date): boolean {
    const day = date.getUTCDate();
    return day === 1 || day === 15;
}

// Adds days to a date and returns a new Date
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

// ─── createBatch ──────────────────────────────────────────────────────────────
export async function createBatch(data: CreateBatchDTO) {
    const { trackId, startDate: startDateStr } = data;

    // 1. Parse and validate start date
    const startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) {
        throw new AppError('INVALID_DATE', 'Invalid start date format. Use YYYY-MM-DD.', 400);
    }

    if (!isValidBatchStartDate(startDate)) {
        throw new AppError(
            'INVALID_BATCH_START_DATE',
            'Batch start date must be the 1st or 15th of the month.',
            400
        );
    }

    // 2. Confirm track exists
    const track = await prisma.track.findUnique({
        where: { id: trackId, isActive: true },
    });

    if (!track) {
        throw AppErrors.notFound('Track');
    }

    // 3. Calculate end date from track duration
    const endDate = addDays(startDate, track.durationDays);

    // 4. Check for duplicate batch (same track + same start date)
    const existing = await prisma.batch.findFirst({
        where: { trackId, startDate },
    });

    if (existing) {
        throw new AppError(
            'DUPLICATE_BATCH',
            'A batch for this track and start date already exists.',
            409
        );
    }

    // 5. Create the batch
    const batch = await prisma.batch.create({
        data: {
            trackId,
            startDate,
            endDate,
            status: 'OPEN',
            capacity: 100,
        },
        include: {
            track: { select: { name: true, slug: true } },
        },
    });

    logger.info('Batch created', {
        batchId: batch.id,
        trackId,
        startDate: startDateStr,
    });

    return batch;
}

// ─── getBatches ───────────────────────────────────────────────────────────────
export async function getBatches(filters: {
    status?: string;
    trackId?: string;
}) {
    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.trackId) where.trackId = filters.trackId;

    const batches = await prisma.batch.findMany({
        where,
        include: {
            track: { select: { id: true, name: true, slug: true } },
            _count: { select: { applications: true } },
        },
        orderBy: { startDate: 'desc' },
    });

    return batches;
}

// ─── getBatchById ─────────────────────────────────────────────────────────────
export async function getBatchById(id: string) {
    const batch = await prisma.batch.findUnique({
        where: { id },
        include: {
            track: { select: { id: true, name: true, slug: true } },
            applications: {
                include: {
                    user: { select: { id: true, fullName: true, email: true, phone: true } },
                },
                orderBy: { createdAt: 'desc' },
            },
            _count: { select: { applications: true } },
        },
    });

    if (!batch) {
        throw AppErrors.notFound('Batch');
    }

    return batch;
}

// ─── assignApplicationsToBatch ────────────────────────────────────────────────
// Moves one or more applications into a batch.
// Updates both the application records and the batch's currentCount.
export async function assignApplicationsToBatch(
    batchId: string,
    applicationIds: string[]
) {
    // 1. Confirm batch exists and is still open
    const batch = await prisma.batch.findUnique({
        where: { id: batchId },
    });

    if (!batch) {
        throw AppErrors.notFound('Batch');
    }

    if (batch.status !== 'OPEN') {
        throw new AppError(
            'BATCH_NOT_OPEN',
            'Applications can only be assigned to open batches.',
            400
        );
    }

    // 2. Check capacity
    const newCount = batch.currentCount + applicationIds.length;
    if (newCount > batch.capacity) {
        throw new AppError(
            'BATCH_FULL',
            `This batch only has ${batch.capacity - batch.currentCount} spots remaining.`,
            400
        );
    }

    // 3. Update applications + batch count in a transaction
    await prisma.$transaction(async (tx) => {
        // Assign all applications to this batch
        // Assign applications to batch
    const updateResult = await tx.application.updateMany({
      where: { id: { in: applicationIds } },
      data: {
        batchId,
        status: 'ENROLLED',
      },
    });

    // Increment by actual number updated — not the requested count
    await tx.batch.update({
      where: { id: batchId },
      data: { currentCount: { increment: updateResult.count } },
    });
    });

    logger.info('Applications assigned to batch', {
        batchId,
        count: applicationIds.length,
    });
}

// ─── sendOfferLetters ─────────────────────────────────────────────────────────
// Sends offer letter emails to all enrolled applicants in a batch
// who haven't received one yet.
export async function sendOfferLetters(batchId: string) {
    const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        include: {
            track: { select: { name: true } },
            applications: {
                where: {
                    status: 'ENROLLED',
                    offerLetterSentAt: null, // Only unsent
                },
                include: {
                    user: { select: { email: true, fullName: true } },
                },
            },
        },
    });

    if (!batch) {
        throw AppErrors.notFound('Batch');
    }

    if (batch.applications.length === 0) {
        return { sent: 0, skipped: 0, message: 'No eligible applications found.' };
    }

    const startDate = batch.startDate.toISOString().split('T')[0];
    const endDate = batch.endDate.toISOString().split('T')[0];

    let sent = 0;
    let failed = 0;

    for (const application of batch.applications) {
        try {
            await sendOfferLetter(
                application.user.email,
                application.user.fullName,
                batch.track.name,
                startDate,
                endDate,
                batchId
            );

            // Mark offer letter as sent
            await prisma.application.update({
                where: { id: application.id },
                data: { offerLetterSentAt: new Date() },
            });

            sent++;
        } catch {
            failed++;
            logger.error('Failed to send offer letter', {
                applicationId: application.id,
            });
        }
    }

    logger.info('Offer letters sent', { batchId, sent, failed });
    return { sent, failed };
}

// ─── sendTaskForms ────────────────────────────────────────────────────────────
// Sends task submission form emails to enrolled applicants
// who haven't received one yet.
export async function sendTaskForms(
    batchId: string,
    submissionFormUrl: string
) {
    const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        include: {
            track: { select: { name: true } },
            applications: {
                where: {
                    status: 'ENROLLED',
                    offerLetterSentAt: { not: null }, // Must have received offer letter
                    taskFormSentAt: null,              // Not yet sent task form
                },
                include: {
                    user: { select: { email: true, fullName: true } },
                },
            },
        },
    });

    if (!batch) {
        throw AppErrors.notFound('Batch');
    }

    if (batch.applications.length === 0) {
        return { sent: 0, failed: 0, message: 'No eligible applications found.' };
    }

    // Deadline is the batch end date
    const deadline = batch.endDate.toISOString().split('T')[0];

    let sent = 0;
    let failed = 0;

    for (const application of batch.applications) {
        try {
            await sendTaskSubmissionForm(
                application.user.email,
                application.user.fullName,
                batch.track.name,
                submissionFormUrl,
                deadline,
                application.id
            );

            // Mark task form as sent
            await prisma.application.update({
                where: { id: application.id },
                data: { taskFormSentAt: new Date() },
            });

            sent++;
        } catch {
            failed++;
            logger.error('Failed to send task form', {
                applicationId: application.id,
            });
        }
    }

    logger.info('Task forms sent', { batchId, sent, failed });
    return { sent, failed };
}

// ─── updateBatchStatus ────────────────────────────────────────────────────────
export async function updateBatchStatus(
    batchId: string,
    status: 'OPEN' | 'ACTIVE' | 'COMPLETED'
) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });

    if (!batch) {
        throw AppErrors.notFound('Batch');
    }

    // Enforce valid status transitions
    const validTransitions: Record<string, string[]> = {
        OPEN: ['ACTIVE'],
        ACTIVE: ['COMPLETED'],
        COMPLETED: [], // Terminal state — no further transitions
    };

    if (!validTransitions[batch.status].includes(status)) {
        throw new AppError(
            'INVALID_STATUS_TRANSITION',
            `Cannot transition batch from ${batch.status} to ${status}.`,
            400
        );
    }

    return prisma.batch.update({
        where: { id: batchId },
        data: { status },
    });
}