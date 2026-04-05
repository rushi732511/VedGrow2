import { Router, Request, Response } from 'express';
import prisma from '../../config/db';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticateAdmin } from '../../middleware/authenticate';

const router = Router();

router.use(authenticateAdmin);

// ─── GET /v1/admin/analytics/dashboard ───────────────────────────────────────
// Returns high-level platform stats for the admin home screen
router.get(
    '/dashboard',
    asyncHandler(async (_req: Request, res: Response) => {
        // Start of current month — used for "this month" metrics
        const now = new Date();
        const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        const startOfLastMonth = new Date(
            Date.UTC(now.getFullYear(), now.getMonth() - 1, 1)
        );

        // Run all counts in parallel
        const [
            totalApplications,
            thisMonthApplications,
            lastMonthApplications,
            paidApplications,
            enrolledApplications,
            completedApplications,
            totalCertificates,
            activatedCertificates,
            openBatches,
            activeBatches,
            unresolvedContacts,
            recentApplications,
        ] = await Promise.all([
            // All time totals
            prisma.application.count(),
            prisma.application.count({
                where: { createdAt: { gte: startOfMonth } },
            }),
            prisma.application.count({
                where: {
                    createdAt: { gte: startOfLastMonth, lt: startOfMonth },
                },
            }),
            prisma.application.count({
                where: { paymentStatus: 'COMPLETED' },
            }),
            prisma.application.count({
                where: { status: 'ENROLLED' },
            }),
            prisma.application.count({
                where: { status: 'COMPLETED' },
            }),
            prisma.certificate.count(),
            prisma.certificate.count({
                where: { isActivated: true },
            }),
            prisma.batch.count({
                where: { status: 'OPEN' },
            }),
            prisma.batch.count({
                where: { status: 'ACTIVE' },
            }),
            prisma.contactSubmission.count({
                where: { isResolved: false },
            }),

            // 5 most recent applications for activity feed
            prisma.application.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { fullName: true, email: true } },
                    track: { select: { name: true } },
                },
            }),
        ]);

        // ── Derived Metrics ───────────────────────────────────────────────────────

        // Payment conversion: % of all applicants who paid
        const paymentConversionRate =
            totalApplications > 0
                ? Math.round((paidApplications / totalApplications) * 100)
                : 0;

        // Month-over-month growth
        const monthOverMonthGrowth =
            lastMonthApplications > 0
                ? Math.round(
                    ((thisMonthApplications - lastMonthApplications) /
                        lastMonthApplications) *
                    100
                )
                : null; // null means no data to compare

        // Certificate issuance rate: % of completed applications with a certificate
        const certificateIssuanceRate =
            completedApplications > 0
                ? Math.round((activatedCertificates / completedApplications) * 100)
                : 0;

        res.json({
            success: true,
            data: {
                overview: {
                    totalApplications,
                    thisMonthApplications,
                    monthOverMonthGrowth, // percentage, null if no previous month data
                    paidApplications,
                    paymentConversionRate, // percentage
                },
                pipeline: {
                    enrolled: enrolledApplications,
                    completed: completedApplications,
                    certificatesIssued: activatedCertificates,
                    certificateIssuanceRate, // percentage
                },
                batches: {
                    open: openBatches,
                    active: activeBatches,
                },
                support: {
                    unresolvedContacts,
                },
                recentApplications,
            },
        });
    })
);

// ─── GET /v1/admin/analytics/funnel ──────────────────────────────────────────
// Shows drop-off at each stage of the internship pipeline
router.get(
    '/funnel',
    asyncHandler(async (_req: Request, res: Response) => {
        // Each stage count — these are cumulative from top to bottom of the funnel
        const [
            applied,
            paid,
            enrolled,
            taskSubmitted,
            completed,
            certificateIssued,
        ] = await Promise.all([
            prisma.application.count(),
            prisma.application.count({
                where: { paymentStatus: 'COMPLETED' },
            }),
            prisma.application.count({
                where: { status: 'ENROLLED' },
            }),
            prisma.application.count({
                where: { taskSubmittedAt: { not: null } },
            }),
            prisma.application.count({
                where: { status: 'COMPLETED' },
            }),
            prisma.certificate.count({
                where: { isActivated: true },
            }),
        ]);

        // Helper: calculate conversion from one stage to the previous
        const conversionRate = (current: number, previous: number): number =>
            previous > 0 ? Math.round((current / previous) * 100) : 0;

        res.json({
            success: true,
            data: {
                funnel: [
                    {
                        stage: 'Applied',
                        count: applied,
                        conversionFromPrevious: 100,
                    },
                    {
                        stage: 'Payment Completed',
                        count: paid,
                        conversionFromPrevious: conversionRate(paid, applied),
                    },
                    {
                        stage: 'Enrolled in Batch',
                        count: enrolled,
                        conversionFromPrevious: conversionRate(enrolled, paid),
                    },
                    {
                        stage: 'Task Submitted',
                        count: taskSubmitted,
                        conversionFromPrevious: conversionRate(taskSubmitted, enrolled),
                    },
                    {
                        stage: 'Internship Completed',
                        count: completed,
                        conversionFromPrevious: conversionRate(completed, taskSubmitted),
                    },
                    {
                        stage: 'Certificate Issued',
                        count: certificateIssued,
                        conversionFromPrevious: conversionRate(certificateIssued, completed),
                    },
                ],
            },
        });
    })
);

export default router;