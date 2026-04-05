import axios, { AxiosError, AxiosInstance } from 'axios';

// ─── Token Store ──────────────────────────────────────────────────────────────
// Access token lives in memory — safe from XSS attacks
// (localStorage can be read by injected scripts; memory cannot)
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ─── Create Axios Instance ────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Send cookies (refresh token) with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Automatically attach access token to every outgoing request
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handle token expiry — silently refresh and retry the failed request
api.interceptors.response.use(
  // Success: pass through unchanged
  (response) => response,

  // Error: check if it's a token expiry
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    // If 401 + token expired + we haven't retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Prevent infinite retry loop

      try {
        // Attempt to get a new access token using the refresh cookie
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = response.data.data.accessToken as string;
        setAccessToken(newToken);

        // Retry the original request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch {
        // Refresh failed — clear token and redirect to login
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Typed API Functions ──────────────────────────────────────────────────────
// Convenience functions for each endpoint — strongly typed

import type {
  Track,
  Application,
  Batch,
  Certificate,
  CertificateVerification,
  DashboardStats,
  FunnelStage,
  EmailLog,
  ContactSubmission,
  AdminUser,
} from './types';

// Public
export const tracksApi = {
  list: () =>
    api.get<{ success: true; data: { tracks: Track[] }; meta: { total: number } }>('/tracks'),
  get: (slug: string) =>
    api.get<{ success: true; data: { track: Track } }>(`/tracks/${slug}`),
};

export const applicationsApi = {
  create: (data: {
    fullName: string;
    email: string;
    phone: string;
    trackSlug: string;
  }) => api.post<{ success: true; data: { applicationId: string; status: string; paymentAmount: number; track: { name: string; slug: string } } }>('/applications', data),

  createPaymentOrder: (applicationId: string) =>
    api.post<{ success: true; data: { orderId: string; amount: number; currency: string; keyId: string; prefill: { name: string; email: string } } }>(
      `/applications/${applicationId}/payment`
    ),

  verifyPayment: (
    applicationId: string,
    data: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }
  ) =>
    api.post(`/applications/${applicationId}/payment/verify`, data),
};

export const certificatesApi = {
  verify: (cin: string) =>
    api.get<{ success: true; data: CertificateVerification }>(
      `/certificates/verify?cin=${encodeURIComponent(cin)}`
    ),
};

export const contactApi = {
  submit: (data: {
    fullName: string;
    email: string;
    phone?: string;
    message: string;
  }) => api.post('/contact', data),
};

// Admin
export const adminAuthApi = {
  login: (email: string, password: string) =>
    api.post<{ success: true; data: { accessToken: string; admin: AdminUser } }>(
      '/admin/auth/login',
      { email, password }
    ),
  logout: () => api.post('/admin/auth/logout'),
  me: () =>
    api.get<{ success: true; data: { admin: AdminUser } }>('/admin/auth/me'),
};

export const adminApplicationsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<{ success: true; data: { applications: Application[] }; meta: { total: number; totalPages: number; page: number; limit: number } }>(
      '/admin/applications',
      { params }
    ),
  get: (id: string) =>
    api.get<{ success: true; data: { application: Application } }>(
      `/admin/applications/${id}`
    ),
  update: (id: string, data: Partial<Application>) =>
    api.patch(`/admin/applications/${id}`, data),
  bulkAction: (data: {
    applicationIds: string[];
    action: string;
    batchId?: string;
  }) => api.post('/admin/applications/bulk-action', data),
};

export const adminBatchesApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ success: true; data: { batches: Batch[] }; meta: { total: number } }>(
      '/admin/batches',
      { params }
    ),
  get: (id: string) =>
    api.get<{ success: true; data: { batch: Batch } }>(`/admin/batches/${id}`),
  create: (data: { trackId: string; startDate: string }) =>
    api.post<{ success: true; data: { batch: Batch } }>('/admin/batches', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/batches/${id}/status`, { status }),
  assign: (id: string, applicationIds: string[]) =>
    api.post(`/admin/batches/${id}/assign`, { applicationIds }),
  sendOfferLetters: (id: string) =>
    api.post(`/admin/batches/${id}/offer-letters`),
  sendTaskForms: (id: string, submissionFormUrl: string) =>
    api.post(`/admin/batches/${id}/task-forms`, { submissionFormUrl }),
};

export const adminCertificatesApi = {
  list: (params?: Record<string, string | boolean | number>) =>
    api.get<{ success: true; data: { certificates: Certificate[] }; meta: { total: number; totalPages: number } }>(
      '/certificates/admin',
      { params }
    ),
  generate: (applicationId: string) =>
    api.post<{ success: true; data: { certificate: Certificate } }>(
      '/certificates/admin/generate',
      { applicationId }
    ),
  bulkGenerate: (applicationIds: string[]) =>
    api.post('/certificates/admin/bulk-generate', { applicationIds }),
  activate: (cin: string) =>
    api.post(`/certificates/admin/${cin}/activate`),
};

export const adminAnalyticsApi = {
  dashboard: () =>
    api.get<{ success: true; data: DashboardStats }>('/admin/analytics/dashboard'),
  funnel: () =>
    api.get<{ success: true; data: { funnel: FunnelStage[] } }>(
      '/admin/analytics/funnel'
    ),
};

export const adminEmailsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<{ success: true; data: { logs: EmailLog[] }; meta: { total: number; totalPages: number } }>(
      '/admin/emails',
      { params }
    ),
};

export const adminContactsApi = {
  list: (params?: Record<string, string | number | boolean>) =>
    api.get<{ success: true; data: { submissions: ContactSubmission[] }; meta: { total: number; totalPages: number } }>(
      '/contact/admin',
      { params }
    ),
  resolve: (id: string) =>
    api.patch(`/contact/admin/${id}/resolve`),
};