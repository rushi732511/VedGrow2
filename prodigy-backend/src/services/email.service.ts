import sgMail from '@sendgrid/mail';
import { Prisma } from '@prisma/client';
import prisma from '../config/db';
import { env } from '../config/env';
import logger from '../utils/logger';
import { applicationConfirmationTemplate } from '../templates/application-confirmation';
import { offerLetterTemplate } from '../templates/offer-letter';
import { taskSubmissionTemplate } from '../templates/task-submission';
import { certificateIssuedTemplate } from '../templates/certificate-issued';
import { lorIssuedTemplate } from '../templates/lor-issued';
import {
  generateOfferLetterPdf,
  generateCertificatePdf,
  generateLorPdf,
} from './pdf.service';
// Initialize SendGrid with API key
sgMail.setApiKey(env.SENDGRID_API_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────
type TemplateName =
  | 'application-confirmation'
  | 'offer-letter'
  | 'task-submission'
  | 'certificate-issued'
  | 'lor-issued';

interface EmailAttachment {
  content: string;      // base64 encoded
  filename: string;
  type: string;
  disposition: 'attachment' | 'inline';
}

interface EmailOptions {
  to: string;
  templateName: TemplateName;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  attachment?: EmailAttachment;
}

// ─── renderTemplate ───────────────────────────────────────────────────────────
// Converts a template name + data into a subject + HTML string
function renderTemplate(
  templateName: TemplateName,
  data: Record<string, unknown>
): { subject: string; html: string } {
  switch (templateName) {
    case 'application-confirmation':
      return applicationConfirmationTemplate(
        data as Parameters<typeof applicationConfirmationTemplate>[0]
      );
    case 'offer-letter':
      return offerLetterTemplate(
        data as Parameters<typeof offerLetterTemplate>[0]
      );
    case 'task-submission':
      return taskSubmissionTemplate(
        data as Parameters<typeof taskSubmissionTemplate>[0]
      );
    case 'certificate-issued':
      return certificateIssuedTemplate(
        data as Parameters<typeof certificateIssuedTemplate>[0]
      );
    case 'lor-issued':
      return lorIssuedTemplate(
        data as Parameters<typeof lorIssuedTemplate>[0]
      );
    default:
      throw new Error(`Unknown email template: ${templateName}`);
  }
}

// ─── sendEmail ────────────────────────────────────────────────────────────────
// Core email sending function. Always logs the attempt regardless of outcome.
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, templateName, data, metadata, attachment } = options;

  // 1. Render the template
  const { subject, html } = renderTemplate(templateName, data);

  // 2. Create a log entry with QUEUED status before attempting send
  const emailLog = await prisma.emailLog.create({
    data: {
      recipientEmail: to,
      templateName,
      subject,
      status: 'QUEUED',
      metadata: (metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  // 3. Attempt to send via SendGrid
  try {
    const [response] = await sgMail.send({
      to,
      from: {
        email: env.SENDGRID_FROM_EMAIL,
        name: env.SENDGRID_FROM_NAME,
      },
      subject,
      html,
      ...(attachment && { attachments: [attachment] }),
    });

    // 4. Update log to SENT
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'SENT',
        sendgridMessageId: response.headers['x-message-id'] as string,
        sentAt: new Date(),
      },
    });

    logger.info('Email sent successfully', {
      template: templateName,
      to: to.replace(/(.{2}).+@/, '$1***@'),
      messageId: response.headers['x-message-id'],
    });
  } catch (error) {
    // 5. Update log to FAILED — do not rethrow
    // Email failure should not crash the main workflow
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown SendGrid error';

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'FAILED',
        errorMessage,
      },
    });

    logger.error('Email send failed', {
      template: templateName,
      to: to.replace(/(.{2}).+@/, '$1***@'),
      error: errorMessage,
    });

    // Note: we intentionally do NOT rethrow here.
    // A failed email should not block certificate generation or batch processing.
  }
}

// ─── sendBulkEmails ───────────────────────────────────────────────────────────
// Sends the same template to multiple recipients.
// Processes sequentially to avoid SendGrid rate limits.
export async function sendBulkEmails(
  recipients: Array<{ email: string; data: Record<string, unknown> }>,
  templateName: TemplateName,
  metadata?: Record<string, unknown>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    try {
      await sendEmail({
        to: recipient.email,
        templateName,
        data: recipient.data,
        metadata,
      });
      sent++;

      // Small delay between sends to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch {
      failed++;
    }
  }

  logger.info('Bulk email complete', { templateName, sent, failed });
  return { sent, failed };
}

// ─── Convenience Functions ────────────────────────────────────────────────────
// Named functions for each email type — cleaner call sites

export async function sendApplicationConfirmation(
  email: string,
  fullName: string,
  trackName: string,
  applicationId: string
) {
  await sendEmail({
    to: email,
    templateName: 'application-confirmation',
    data: { fullName, trackName, applicationId },
    metadata: { applicationId },
  });
}

export async function sendOfferLetter(
  email: string,
  fullName: string,
  trackName: string,
  startDate: string,
  endDate: string,
  batchId: string,
  cin?: string
) {
  // Generate PDF attachment
  let pdfBuffer: Buffer | null = null;
  try {
    const issueDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    pdfBuffer = await generateOfferLetterPdf({
      fullName,
      trackName,
      startDate,
      endDate,
      cin: cin ?? `PI-${new Date().toISOString().slice(2,8).replace(/-/g,'')}-OFFER`,
      issueDate,
    });
  } catch (err) {
    logger.error('Failed to generate offer letter PDF', { error: err });
  }

  await sendEmail({
    to: email,
    templateName: 'offer-letter',
    data: { fullName, trackName, startDate, endDate, batchId },
    metadata: { batchId },
    attachment: pdfBuffer ? {
      content: pdfBuffer.toString('base64'),
      filename: 'Offer_Letter.pdf',
      type: 'application/pdf',
      disposition: 'attachment',
    } : undefined,
  });
}

export async function sendTaskSubmissionForm(
  email: string,
  fullName: string,
  trackName: string,
  submissionFormUrl: string,
  deadline: string,
  applicationId: string
) {
  await sendEmail({
    to: email,
    templateName: 'task-submission',
    data: { fullName, trackName, submissionFormUrl, deadline },
    metadata: { applicationId },
  });
}

export async function sendLorEmail(
  email: string,
  fullName: string,
  trackName: string,
  cin: string,
  collegeName?: string
) {
  // Generate LoR PDF
  let pdfBuffer: Buffer | null = null;
  try {
    const issuedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    pdfBuffer = await generateLorPdf({
      fullName, trackName, cin, issuedDate, collegeName,
    });
  } catch (err) {
    logger.error('Failed to generate LoR PDF', { error: err });
  }

  await sendEmail({
    to: email,
    templateName: 'lor-issued',
    data: { fullName, trackName, cin },
    metadata: { cin },
    attachment: pdfBuffer ? {
      content: pdfBuffer.toString('base64'),
      filename: 'Letter_of_Recommendation.pdf',
      type: 'application/pdf',
      disposition: 'attachment',
    } : undefined,
  });
}
export async function sendCertificateEmail(
  email: string,
  fullName: string,
  trackName: string,
  cin: string,
  issuedDate: string,
  verifyUrl: string,
  startDate?: string,
  endDate?: string
) {
  // Generate certificate PDF
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateCertificatePdf({
      fullName,
      trackName,
      startDate: startDate ?? issuedDate,
      endDate: endDate ?? issuedDate,
      cin,
      issuedDate,
      verifyUrl,
    });
  } catch (err) {
    logger.error('Failed to generate certificate PDF', { error: err });
  }

  await sendEmail({
    to: email,
    templateName: 'certificate-issued',
    data: { fullName, trackName, cin, issuedDate, verifyUrl },
    metadata: { cin },
    attachment: pdfBuffer ? {
      content: pdfBuffer.toString('base64'),
      filename: 'Certificate.pdf',
      type: 'application/pdf',
      disposition: 'attachment',
    } : undefined,
  });
}