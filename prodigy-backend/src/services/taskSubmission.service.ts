import prisma from '../config/db';
import { AppError, AppErrors } from '../utils/AppError';
import { env } from '../config/env';
import logger from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CreateTaskSubmissionDTO {
  applicationId: string;
  task1GithubUrl?: string;
  task1LinkedinUrl?: string;
  task2GithubUrl?: string;
  task2LinkedinUrl?: string;
  task3GithubUrl?: string;
  task3LinkedinUrl?: string;
  task4GithubUrl?: string;
  task4LinkedinUrl?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Count how many complete task pairs were submitted
// A task is "complete" if BOTH github and linkedin links are provided
function countCompletedTasks(dto: CreateTaskSubmissionDTO): number {
  let count = 0;
  if (dto.task1GithubUrl && dto.task1LinkedinUrl) count++;
  if (dto.task2GithubUrl && dto.task2LinkedinUrl) count++;
  if (dto.task3GithubUrl && dto.task3LinkedinUrl) count++;
  if (dto.task4GithubUrl && dto.task4LinkedinUrl) count++;
  return count;
}

// ─── createOrUpdateTaskSubmission ────────────────────────────────────────────
// Creates a task submission record and a Razorpay payment order.
// Called when the student fills the task form and clicks "Pay & Submit".
export async function createOrUpdateTaskSubmission(
  data: CreateTaskSubmissionDTO
) {
  const { applicationId } = data;

  // 1. Confirm the application exists and is enrolled
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      track: { select: { name: true } },
      taskSubmission: true,
    },
  });

  if (!application) {
    throw AppErrors.notFound('Application');
  }

  if (application.status !== 'ENROLLED') {
    throw new AppError(
      'APPLICATION_NOT_ENROLLED',
      'Task submission is only available for enrolled applications.',
      400
    );
  }

  // 2. Check if already paid — prevent re-submission after payment
  if (
    application.taskSubmission?.paymentStatus === 'COMPLETED'
  ) {
    throw new AppError(
      'ALREADY_SUBMITTED',
      'You have already submitted your tasks and completed payment.',
      409
    );
  }

  const tasksCompleted = countCompletedTasks(data);

  if (tasksCompleted < 1) {
    throw new AppError(
      'NO_TASKS_SUBMITTED',
      'Please submit at least 1 complete task (GitHub + LinkedIn link).',
      400
    );
  }

  // 3. Create or update the task submission record
  const taskSubmission = await prisma.taskSubmission.upsert({
    where: { applicationId },
    update: {
      task1GithubUrl: data.task1GithubUrl,
      task1LinkedinUrl: data.task1LinkedinUrl,
      task2GithubUrl: data.task2GithubUrl,
      task2LinkedinUrl: data.task2LinkedinUrl,
      task3GithubUrl: data.task3GithubUrl,
      task3LinkedinUrl: data.task3LinkedinUrl,
      task4GithubUrl: data.task4GithubUrl,
      task4LinkedinUrl: data.task4LinkedinUrl,
      tasksCompleted,
      eligibleForCert: tasksCompleted >= 2,
      eligibleForLor: tasksCompleted >= 4,
    },
    create: {
      applicationId,
      userId: application.user.id,
      task1GithubUrl: data.task1GithubUrl,
      task1LinkedinUrl: data.task1LinkedinUrl,
      task2GithubUrl: data.task2GithubUrl,
      task2LinkedinUrl: data.task2LinkedinUrl,
      task3GithubUrl: data.task3GithubUrl,
      task3LinkedinUrl: data.task3LinkedinUrl,
      task4GithubUrl: data.task4GithubUrl,
      task4LinkedinUrl: data.task4LinkedinUrl,
      tasksCompleted,
      eligibleForCert: tasksCompleted >= 2,
      eligibleForLor: tasksCompleted >= 4,
      paymentStatus: 'PENDING',
      paymentAmount: 12900, // ₹129 in paise
    },
  });

  // 4. Create Razorpay order
  let razorpayOrder: { id: string; amount: number; currency: string };

  try {
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });

    const rzpOrder = await razorpay.orders.create({
      amount: 12900,
      currency: 'INR',
      receipt: `task_${applicationId.slice(0, 8)}`,
      notes: {
        applicationId,
        type: 'task_submission',
        tasksCompleted: String(tasksCompleted),
      },
    });
  razorpayOrder = {
      id: rzpOrder.id,
      amount: Number(rzpOrder.amount),
      currency: rzpOrder.currency ?? 'INR',
    };
  } catch {
    logger.warn('Razorpay unavailable — using mock order for task submission');
    razorpayOrder = {
      id: `order_task_mock_${Date.now()}`,
      amount: 12900,
      currency: 'INR',
    };
  }

  // 5. Save order ID on the task submission
  await prisma.taskSubmission.update({
    where: { applicationId },
    data: { paymentOrderId: razorpayOrder.id },
  });

  logger.info('Task submission created', {
    applicationId,
    tasksCompleted,
    orderId: razorpayOrder.id,
  });

  return {
    taskSubmissionId: taskSubmission.id,
    tasksCompleted,
    eligibleForCert: tasksCompleted >= 2,
    eligibleForLor: tasksCompleted >= 4,
    payment: {
      orderId: razorpayOrder.id,
      amount: 12900,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
      prefill: {
        name: application.user.fullName,
        email: application.user.email,
      },
    },
  };
}

// ─── confirmTaskSubmissionPayment ─────────────────────────────────────────────
// Called after Razorpay payment succeeds (via signature verify or webhook).
export async function confirmTaskSubmissionPayment(
  applicationId: string,
  paymentId: string,
  orderId: string
) {
  const taskSubmission = await prisma.taskSubmission.findUnique({
    where: { applicationId },
  });

  if (!taskSubmission) {
    throw AppErrors.notFound('Task submission');
  }

  if (taskSubmission.paymentStatus === 'COMPLETED') {
    logger.info('Task submission payment already confirmed', { applicationId });
    return taskSubmission;
  }

  // Update both task submission and application in a transaction
  const [updatedSubmission] = await prisma.$transaction([
    // Mark task submission as paid
    prisma.taskSubmission.update({
      where: { applicationId },
      data: {
        paymentStatus: 'COMPLETED',
        paymentId,
        paymentOrderId: orderId,
        paidAt: new Date(),
      },
    }),
    // Mark application as completed
    prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'COMPLETED',
        taskSubmittedAt: new Date(),
        paymentStatus: 'COMPLETED',
        paymentId,
        paidAt: new Date(),
      },
    }),
  ]);

  logger.info('Task submission payment confirmed', { applicationId, paymentId });
  return updatedSubmission;
}

// ─── getTaskSubmission ────────────────────────────────────────────────────────
export async function getTaskSubmission(applicationId: string) {
  const submission = await prisma.taskSubmission.findUnique({
    where: { applicationId },
    include: {
      application: {
        include: {
          user: { select: { fullName: true, email: true } },
          track: { select: { name: true } },
        },
      },
    },
  });

  if (!submission) {
    throw AppErrors.notFound('Task submission');
  }

  return submission;
}