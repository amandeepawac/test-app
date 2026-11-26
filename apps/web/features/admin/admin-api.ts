import { cache } from 'react';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  adminAuditLogListResponseSchema,
  adminDashboardResponseSchema,
  adminEmployerDocumentReviewResponseSchema,
  adminEmployerVerificationDecisionResponseSchema,
  adminEmployerVerificationDetailResponseSchema,
  adminEmployerVerificationListResponseSchema,
  adminJobDetailResponseSchema,
  adminJobListResponseSchema,
  adminJobModerationDecisionResponseSchema,
  adminReportDetailResponseSchema,
  adminReportListResponseSchema,
  adminReportUpdateResponseSchema,
  type AdminAuditLogQuery,
  type AdminEmployerDocumentReview,
  type AdminEmployerVerificationDecision,
  type AdminEmployerVerificationQuery,
  type AdminJobModerationDecision,
  type AdminJobModerationQuery,
  type AdminReportQuery,
  type AdminReportUpdate,
} from '@repo/contracts';
import { authApiFetch } from '@/lib/auth-api';
import { accessCookie } from '@/features/auth/session-cookies';

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

function messageForStatus(status: number) {
  if (status === 401) return 'Your admin session has expired. Sign in again.';
  if (status === 403) return 'An administrator account is required.';
  if (status === 404) return 'This record could not be found.';
  if (status === 409) return 'This record changed. Reload it and try again.';
  if (status === 400 || status === 422) return 'Check the submitted information and try again.';
  return 'The admin service is temporarily unavailable.';
}

async function request<T extends z.ZodType>(
  path: string,
  schema: T,
  init: RequestInit = {},
): Promise<z.output<T>> {
  const accessToken = (await cookies()).get(accessCookie)?.value;
  if (!accessToken) {
    throw new AdminApiError(401, messageForStatus(401));
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  let response: Response;
  try {
    response = await authApiFetch(path, { ...init, headers });
  } catch (error) {
    console.error('Admin API request failed', error);
    if (error instanceof Error) {
      throw new AdminApiError(0, messageForStatus(0));
    }
    throw error;
  }

  if (!response.ok) {
    throw new AdminApiError(response.status, messageForStatus(response.status));
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    console.error('Admin API returned invalid JSON', error);
    throw new AdminApiError(502, 'The admin service returned an invalid response.');
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    console.error(`Admin API response did not match its contract: ${path}`);
    throw new AdminApiError(502, 'The admin service returned an invalid response.');
  }

  return parsed.data;
}

function queryString(values: object) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string' || typeof value === 'number') {
      if (value === '') continue;
      params.set(key, String(value));
    }
  }
  const search = params.toString();
  return search ? `?${search}` : '';
}

export const getAdminDashboard = cache(() =>
  request('/admin/dashboard', adminDashboardResponseSchema),
);

export function listEmployerVerifications(query: AdminEmployerVerificationQuery) {
  return request(
    `/admin/employer-verifications${queryString(query)}`,
    adminEmployerVerificationListResponseSchema,
  );
}

export function getEmployerVerification(id: string) {
  return request(
    `/admin/employer-verifications/${encodeURIComponent(id)}`,
    adminEmployerVerificationDetailResponseSchema,
  );
}

export function reviewEmployerVerification(id: string, body: AdminEmployerVerificationDecision) {
  return request(
    `/admin/employer-verifications/${encodeURIComponent(id)}`,
    adminEmployerVerificationDecisionResponseSchema,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

export function reviewEmployerDocument(
  id: string,
  documentId: string,
  body: AdminEmployerDocumentReview,
) {
  return request(
    `/admin/employer-verifications/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}`,
    adminEmployerDocumentReviewResponseSchema,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

export function listAdminJobs(query: AdminJobModerationQuery) {
  return request(`/admin/jobs${queryString(query)}`, adminJobListResponseSchema);
}

export function getAdminJob(id: string) {
  return request(`/admin/jobs/${encodeURIComponent(id)}`, adminJobDetailResponseSchema);
}

export function moderateAdminJob(id: string, body: AdminJobModerationDecision) {
  return request(
    `/admin/jobs/${encodeURIComponent(id)}/moderation`,
    adminJobModerationDecisionResponseSchema,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

export function listAdminReports(query: AdminReportQuery) {
  return request(`/admin/reports${queryString(query)}`, adminReportListResponseSchema);
}

export function getAdminReport(id: string) {
  return request(`/admin/reports/${encodeURIComponent(id)}`, adminReportDetailResponseSchema);
}

export function updateAdminReport(id: string, body: AdminReportUpdate) {
  return request(`/admin/reports/${encodeURIComponent(id)}`, adminReportUpdateResponseSchema, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function listAdminAuditLogs(query: AdminAuditLogQuery) {
  return request(`/admin/audit-logs${queryString(query)}`, adminAuditLogListResponseSchema);
}
