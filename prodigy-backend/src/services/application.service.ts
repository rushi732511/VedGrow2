import { PrismaClient } from '@prisma/client';
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
  gender?: string;
  collegeName?: string;
  highestQualification?: string;
  passingYear?: string;
  country?: string;
  joinedSocials?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCurrentApplicationMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
}

// ─── createApplication ────────────────────────────────────────────────────────
export async function createApplication(data: CreateApplicationDTO) {
  const {
    fullName, email, phone, trackSlug,
    gender, collegeName, highestQualification,
    passingYear, country, joinedSocials,
  } = data;

  const applicationMonth = getCurrentApplicationMonth();

  // 1. Confirm the track exists and is active
  const track = await prisma.track.findUnique({
    where: { slug: trackSlug, isActive: true },
  });

  if (!track) {
    throw AppErrors.notFound('Internship track');
  }

  // 2. Check if this email already has an application this month
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

  // 3. Create user + application in a single transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      update: {
        fullName,
        phone,
        ...(gender && { gender }),
        ...(collegeName && { collegeName }),
        ...(highestQualification && { highestQualification }),
        ...(passingYear && { passingYear }),
        ...(country && { country }),
      },
      create: {
        email,
        fullName,
        phone,
        gender,
        collegeName,
        highestQualification,
        passingYear,
        country,
      },
    });

    const application = await tx.application.create({
      data: {
        userId: user.id,
        trackId: track.id,
        applicationMonth,
        status: 'SUBMITTED',
        paymentStatus: 'PENDING',
        paymentAmount: 0,
        joinedSocials: joinedSocials ?? false,
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

  // Send confirmation email — non-blocking
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