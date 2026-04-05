import prisma from '../config/db';
import { AppError, AppErrors } from '../utils/AppError';
import logger from '../utils/logger';
import { sendApplicationConfirmation } from './email.service';
// ─── Types ────────────────────────────────────────────────────────────────────
export interface CreateApplicationDTO {
    fullName: string;
    email: string;
    phone: string;
    trackSlug: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Returns the first day of the current month at midnight UTC
// e.g., called on Feb 14 2025 → returns 2025-02-01T00:00:00.000Z
// This is stored as applicationMonth — the unique constraint uses it
// to enforce "one application per user per month"
function getCurrentApplicationMonth(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
}

// ─── createApplication ────────────────────────────────────────────────────────
export async function createApplication(data: CreateApplicationDTO) {
    const { fullName, email, phone, trackSlug } = data;
    const applicationMonth = getCurrentApplicationMonth();

    // 1. Confirm the track exists and is active
    const track = await prisma.track.findUnique({
        where: { slug: trackSlug, isActive: true },
    });

    if (!track) {
        throw AppErrors.notFound('Internship track');
    }

    // 2. Check if this email already has an application this month
    // We look up the user first, then check their applications
    const existingUser = await prisma.user.findUnique({
        where: { email },
        include: {
            applications: {
                where: { applicationMonth },
            },
        },
    });

    if (existingUser && existingUser.applications.length > 0) {
        throw new AppError(
            'DUPLICATE_APPLICATION',
            'You have already applied for an internship this month. Please wait until next month to apply again.',
            409
        );
    }

    // 3. Create user (if new) + application in a single transaction
    // A transaction means: if creating the application fails after the user
    // was created, the user creation is also rolled back. All or nothing.
    const result = await prisma.$transaction(async (tx: {
        user: {
            upsert: (arg0: {
                where: { email: string; }; update: {
                    // Update name/phone in case they changed since last application
                    fullName: string; phone: string;
                }; create: { email: string; fullName: string; phone: string; };
            }) => any;
        }; application: { create: (arg0: { data: { userId: any; trackId: any; applicationMonth: Date; status: string; paymentStatus: string; paymentAmount: number; }; include: { track: { select: { name: boolean; slug: boolean; }; }; }; }) => any; };
    }) => {
        // upsert user — create if new email, return existing if already registered
        const user = await tx.user.upsert({
            where: { email },
            update: {
                // Update name/phone in case they changed since last application
                fullName,
                phone,
            },
            create: {
                email,
                fullName,
                phone,
            },
        });

        // Create the application
        const application = await tx.application.create({
            data: {
                userId: user.id,
                trackId: track.id,
                applicationMonth,
                status: 'SUBMITTED',
                paymentStatus: 'PENDING',
                paymentAmount: 12900, // ₹129.00 in paise
            },
            include: {
                track: {
                    select: { name: true, slug: true },
                },
            },
        });

        return { user, application };
    });

    logger.info('Application created', {
        applicationId: result.application.id,
        trackSlug,
        email: email.replace(/(.{2}).+@/, '$1***@'),
    });

    // Send confirmation email — non-blocking, failure won't affect response
    sendApplicationConfirmation(
        result.user.email,
        result.user.fullName,
        track.name,
        result.application.id
    ).catch((err) =>
        logger.error('Failed to send confirmation email', { error: err })
    );

    return result;
}

// ─── getApplicationById ───────────────────────────────────────────────────────
export async function getApplicationById(id: string) {
    const application = await prisma.application.findUnique({
        where: { id },
        include: {
            user: {
                select: { id: true, fullName: true, email: true, phone: true },
            },
            track: {
                select: { id: true, name: true, slug: true },
            },
            batch: {
                select: { id: true, startDate: true, endDate: true, status: true },
            },
        },
    });

    if (!application) {
        throw AppErrors.notFound('Application');
    }

    return application;
}