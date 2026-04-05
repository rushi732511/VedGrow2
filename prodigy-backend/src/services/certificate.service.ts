import prisma from '../config/db';
import { AppError, AppErrors } from '../utils/AppError';
import logger from '../utils/logger';
import { sendCertificateEmail } from './email.service';
import { env } from '../config/env';

// ─── CIN Generation ───────────────────────────────────────────────────────────
// Format: PI-YYMMDD-XXXXX
// PI     = vedgrow  prefix
// YYMMDD = issue date (e.g., 250201 for Feb 1 2025)
// XXXXX  = 5 character alphanumeric (uppercase, collision-resistant)

const CIN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// Removed: I, O, 0, 1 — visually ambiguous characters

function generateRandomSuffix(length: number = 5): string {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += CIN_CHARS[Math.floor(Math.random() * CIN_CHARS.length)];
    }
    return result;
}

function formatDatePart(date: Date): string {
    const yy = String(date.getUTCFullYear()).slice(2); // "2025" → "25"
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`; // "250201"
}

// Generates a unique CIN, retrying on collision (max 5 attempts)
async function generateUniqueCIN(issuedDate: Date): Promise<string> {
    const datePart = formatDatePart(issuedDate);
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const cin = `PI-${datePart}-${generateRandomSuffix()}`;

        // Check if this CIN already exists
        const existing = await prisma.certificate.findUnique({ where: { cin } });
        if (!existing) {
            return cin; // Unique — use it
        }

        logger.warn(`CIN collision on attempt ${attempt}`, { cin });
    }

    throw new AppError(
        'CIN_GENERATION_FAILED',
        'Failed to generate a unique certificate ID. Please try again.',
        500
    );
}

// ─── generateCertificate ──────────────────────────────────────────────────────
// Creates a certificate record for a completed application.
// Called by admin after confirming task submission.
export async function generateCertificate(applicationId: string) {
    // 1. Fetch the application with user and track
    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            user: { select: { id: true, fullName: true, email: true } },
            track: { select: { id: true, name: true } },
            certificate: true, // Check if one already exists
        },
    });

    if (!application) {
        throw AppErrors.notFound('Application');
    }

    // 2. Guard: application must be completed
    if (application.status !== 'COMPLETED') {
        throw new AppError(
            'APPLICATION_NOT_COMPLETED',
            'Certificate can only be generated for completed applications.',
            400
        );
    }

    // 3. Guard: don't generate twice
    if (application.certificate) {
        throw new AppError(
            'CERTIFICATE_ALREADY_EXISTS',
            'A certificate has already been generated for this application.',
            409
        );
    }

    // 4. Generate unique CIN
    const issuedDate = new Date();
    const cin = await generateUniqueCIN(issuedDate);

    // 5. Create certificate record
    const certificate = await prisma.certificate.create({
        data: {
            cin,
            applicationId,
            userId: application.user.id,
            trackId: application.track.id,
            issuedDate,
            isActivated: false, // Activated when email is sent
        },
        include: {
            user: { select: { fullName: true, email: true } },
            track: { select: { name: true } },
        },
    });

    logger.info('Certificate generated', {
        certificateId: certificate.id,
        cin,
        applicationId,
    });

    return certificate;
}

// ─── bulkGenerateCertificates ─────────────────────────────────────────────────
// Generates certificates for multiple completed applications at once.
// Returns results for each — successes and failures separately.
export async function bulkGenerateCertificates(applicationIds: string[]) {
    const results = {
        success: [] as string[],
        failed: [] as { applicationId: string; reason: string }[],
    };

    for (const applicationId of applicationIds) {
        try {
            const cert = await generateCertificate(applicationId);
            results.success.push(cert.cin);
        } catch (error) {
            results.failed.push({
                applicationId,
                reason: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    logger.info('Bulk certificate generation complete', {
        successCount: results.success.length,
        failedCount: results.failed.length,
    });

    return results;
}

// ─── verifyCertificate ────────────────────────────────────────────────────────
// Public endpoint — verifies a CIN and returns certificate details.
// Only returns data for ACTIVATED certificates.
export async function verifyCertificate(cin: string) {
    // Normalize input — uppercase and trim whitespace
    const normalizedCin = cin.trim().toUpperCase();

    const certificate = await prisma.certificate.findUnique({
        where: { cin: normalizedCin },
        include: {
            user: { select: { fullName: true } },
            track: { select: { name: true } },
        },
    });

    // Case 1: CIN doesn't exist at all
    if (!certificate) {
        return null;
    }

    // Case 2: Certificate exists but not yet activated
    // (generated but email not sent yet)
    if (!certificate.isActivated) {
        return { status: 'pending' as const };
    }

    // Case 3: Valid activated certificate — increment verify count
    await prisma.certificate.update({
        where: { cin: normalizedCin },
        data: {
            verifiedCount: { increment: 1 },
            lastVerifiedAt: new Date(),
        },
    });

    return {
        status: 'valid' as const,
        cin: certificate.cin,
        holderName: certificate.user.fullName,
        trackName: certificate.track.name,
        issuedDate: certificate.issuedDate,
        verifiedCount: certificate.verifiedCount + 1,
    };
}

// ─── activateCertificate ──────────────────────────────────────────────────────
// Activates the certificate and sends the certificate email to the holder.
export async function activateCertificate(cin: string) {
    const certificate = await prisma.certificate.findUnique({
        where: { cin },
        include: {
            user: { select: { email: true, fullName: true } },
            track: { select: { name: true } },
        },
    });

    if (!certificate) {
        throw AppErrors.notFound('Certificate');
    }

    if (certificate.isActivated) {
        return certificate; // Already activated — idempotent
    }

    // Activate the certificate
    const updated = await prisma.certificate.update({
        where: { cin },
        data: { isActivated: true },
    });

    // Send certificate email — non-blocking
    const issuedDate = certificate.issuedDate.toISOString().split('T')[0];
    const verifyUrl = `${env.FRONTEND_URL}/verify?cin=${cin}`;

    sendCertificateEmail(
        certificate.user.email,
        certificate.user.fullName,
        certificate.track.name,
        cin,
        issuedDate,
        verifyUrl
    ).catch((err) =>
        logger.error('Failed to send certificate email', { cin, error: err })
    );

    logger.info('Certificate activated', { cin });
    return updated;
}
// ─── getCertificates (admin) ──────────────────────────────────────────────────
export async function getCertificates(filters: {
    isActivated?: boolean;
    trackId?: string;
    page: number;
    limit: number;
}) {
    const { isActivated, trackId, page, limit } = filters;
    const where: Record<string, unknown> = {};

    if (isActivated !== undefined) where.isActivated = isActivated;
    if (trackId) where.trackId = trackId;

    const skip = (page - 1) * limit;

    const [total, certificates] = await Promise.all([
        prisma.certificate.count({ where }),
        prisma.certificate.findMany({
            where,
            skip,
            take: limit,
            include: {
                user: { select: { fullName: true, email: true } },
                track: { select: { name: true, slug: true } },
            },
            orderBy: { issuedDate: 'desc' },
        }),
    ]);

    return { certificates, total, totalPages: Math.ceil(total / limit) };
}