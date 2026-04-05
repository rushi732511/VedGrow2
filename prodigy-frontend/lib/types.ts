// ─── API Response Wrappers ────────────────────────────────────────────────────
// These mirror the response structure our Express backend always returns

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Domain Types ─────────────────────────────────────────────────────────────
// Mirror the Prisma models from the backend

export interface Track {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  curriculum: string[];
  durationDays: number;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface Batch {
  id: string;
  trackId: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'ACTIVE' | 'COMPLETED';
  capacity: number;
  currentCount: number;
  track?: { id: string; name: string; slug: string };
}

export interface Application {
  id: string;
  userId: string;
  trackId: string;
  batchId: string | null;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentAmount: number;
  paymentOrderId: string | null;
  offerLetterSentAt: string | null;
  taskFormSentAt: string | null;
  taskSubmittedAt: string | null;
  applicationMonth: string;
  status: 'SUBMITTED' | 'PAYMENT_PENDING' | 'ENROLLED' | 'COMPLETED' | 'WITHDRAWN';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  track?: { id: string; name: string; slug: string };
  batch?: Batch | null;
  certificate?: Certificate | null;
}

export interface Certificate {
  id: string;
  cin: string;
  applicationId: string;
  userId: string;
  trackId: string;
  issuedDate: string;
  isActivated: boolean;
  certificateUrl: string | null;
  verifiedCount: number;
  lastVerifiedAt: string | null;
  createdAt: string;
  user?: { fullName: string; email: string };
  track?: { name: string; slug: string };
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  lastLoginAt: string | null;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  templateName: string;
  subject: string | null;
  status: 'QUEUED' | 'SENT' | 'FAILED' | 'BOUNCED';
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface ContactSubmission {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  message: string;
  isResolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface CertificateVerification {
  status: 'valid';
  cin: string;
  holderName: string;
  trackName: string;
  issuedDate: string;
  verifiedCount: number;
}

// ─── Analytics Types ──────────────────────────────────────────────────────────
export interface DashboardStats {
  overview: {
    totalApplications: number;
    thisMonthApplications: number;
    monthOverMonthGrowth: number | null;
    paidApplications: number;
    paymentConversionRate: number;
  };
  pipeline: {
    enrolled: number;
    completed: number;
    certificatesIssued: number;
    certificateIssuanceRate: number;
  };
  batches: {
    open: number;
    active: number;
  };
  support: {
    unresolvedContacts: number;
  };
  recentApplications: Application[];
}

export interface FunnelStage {
  stage: string;
  count: number;
  conversionFromPrevious: number;
}