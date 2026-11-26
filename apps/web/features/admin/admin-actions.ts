'use server';

import { z } from 'zod';
import {
  adminAuditLogQuerySchema,
  adminEmployerDocumentReviewSchema,
  adminEmployerVerificationDecisionSchema,
  adminEmployerVerificationQuerySchema,
  adminJobModerationDecisionSchema,
  adminJobModerationQuerySchema,
  adminReportQuerySchema,
  adminReportUpdateSchema,
  type AdminAuditLogQuery,
  type AdminAuditLogListResponse,
  type AdminEmployerDocumentReview,
  type AdminEmployerDocumentReviewResponse,
  type AdminEmployerVerificationDecision,
  type AdminEmployerVerificationDecisionResponse,
  type AdminEmployerVerificationDetailResponse,
  type AdminEmployerVerificationListResponse,
  type AdminEmployerVerificationQuery,
  type AdminJobDetailResponse,
  type AdminJobListResponse,
  type AdminJobModerationDecision,
  type AdminJobModerationDecisionResponse,
  type AdminJobModerationQuery,
  type AdminReportDetailResponse,
  type AdminReportListResponse,
  type AdminReportQuery,
  type AdminReportUpdate,
  type AdminReportUpdateResponse,
  type AdminDashboardResponse,
} from '@repo/contracts';
import {
  AdminApiError,
  getAdminDashboard,
  getAdminJob,
  getAdminReport,
  getEmployerVerification,
  listAdminAuditLogs,
  listAdminJobs,
  listAdminReports,
  listEmployerVerifications,
  moderateAdminJob,
  reviewEmployerDocument,
  reviewEmployerVerification,
  updateAdminReport,
} from './admin-api';

export type AdminActionResult<T> =
  { ok: true; data: T } | { ok: false; error: { status: number; message: string } };

function failure<T>(error: unknown): AdminActionResult<T> {
  if (error instanceof AdminApiError) {
    return { ok: false, error: { status: error.status, message: error.message } };
  }
  if (error instanceof Error) {
    console.error('Admin action failed', error);
  } else {
    console.error('Admin action failed with an unknown error');
  }
  return {
    ok: false,
    error: { status: 0, message: 'The request could not be completed. Please try again.' },
  };
}

async function execute<T>(operation: () => Promise<T>): Promise<AdminActionResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    return failure(error);
  }
}

function invalid<T>(): AdminActionResult<T> {
  return { ok: false, error: { status: 400, message: 'The submitted information is invalid.' } };
}

function parseId(id: string) {
  return z.uuid().safeParse(id);
}

export async function getAdminDashboardAction(): Promise<
  AdminActionResult<AdminDashboardResponse>
> {
  return execute(getAdminDashboard);
}

export async function listEmployerVerificationsAction(
  input: AdminEmployerVerificationQuery,
): Promise<AdminActionResult<AdminEmployerVerificationListResponse>> {
  const query = adminEmployerVerificationQuerySchema.safeParse(input);
  return query.success
    ? execute(() => listEmployerVerifications(query.data))
    : invalid<AdminEmployerVerificationListResponse>();
}

export async function getEmployerVerificationAction(
  id: string,
): Promise<AdminActionResult<AdminEmployerVerificationDetailResponse>> {
  const parsedId = parseId(id);
  return parsedId.success
    ? execute(() => getEmployerVerification(parsedId.data))
    : invalid<AdminEmployerVerificationDetailResponse>();
}

export async function reviewEmployerVerificationAction(
  id: string,
  input: AdminEmployerVerificationDecision,
): Promise<AdminActionResult<AdminEmployerVerificationDecisionResponse>> {
  const parsedId = parseId(id);
  const body = adminEmployerVerificationDecisionSchema.safeParse(input);
  return parsedId.success && body.success
    ? execute(() => reviewEmployerVerification(parsedId.data, body.data))
    : invalid<AdminEmployerVerificationDecisionResponse>();
}

export async function reviewEmployerDocumentAction(
  id: string,
  documentId: string,
  input: AdminEmployerDocumentReview,
): Promise<AdminActionResult<AdminEmployerDocumentReviewResponse>> {
  const parsedId = parseId(id);
  const parsedDocumentId = parseId(documentId);
  const body = adminEmployerDocumentReviewSchema.safeParse(input);
  return parsedId.success && parsedDocumentId.success && body.success
    ? execute(() => reviewEmployerDocument(parsedId.data, parsedDocumentId.data, body.data))
    : invalid<AdminEmployerDocumentReviewResponse>();
}

export async function listAdminJobsAction(
  input: AdminJobModerationQuery,
): Promise<AdminActionResult<AdminJobListResponse>> {
  const query = adminJobModerationQuerySchema.safeParse(input);
  return query.success ? execute(() => listAdminJobs(query.data)) : invalid<AdminJobListResponse>();
}

export async function getAdminJobAction(
  id: string,
): Promise<AdminActionResult<AdminJobDetailResponse>> {
  const parsedId = parseId(id);
  return parsedId.success
    ? execute(() => getAdminJob(parsedId.data))
    : invalid<AdminJobDetailResponse>();
}

export async function moderateAdminJobAction(
  id: string,
  input: AdminJobModerationDecision,
): Promise<AdminActionResult<AdminJobModerationDecisionResponse>> {
  const parsedId = parseId(id);
  const body = adminJobModerationDecisionSchema.safeParse(input);
  return parsedId.success && body.success
    ? execute(() => moderateAdminJob(parsedId.data, body.data))
    : invalid<AdminJobModerationDecisionResponse>();
}

export async function listAdminReportsAction(
  input: AdminReportQuery,
): Promise<AdminActionResult<AdminReportListResponse>> {
  const query = adminReportQuerySchema.safeParse(input);
  return query.success
    ? execute(() => listAdminReports(query.data))
    : invalid<AdminReportListResponse>();
}

export async function getAdminReportAction(
  id: string,
): Promise<AdminActionResult<AdminReportDetailResponse>> {
  const parsedId = parseId(id);
  return parsedId.success
    ? execute(() => getAdminReport(parsedId.data))
    : invalid<AdminReportDetailResponse>();
}

export async function updateAdminReportAction(
  id: string,
  input: AdminReportUpdate,
): Promise<AdminActionResult<AdminReportUpdateResponse>> {
  const parsedId = parseId(id);
  const body = adminReportUpdateSchema.safeParse(input);
  return parsedId.success && body.success
    ? execute(() => updateAdminReport(parsedId.data, body.data))
    : invalid<AdminReportUpdateResponse>();
}

export async function listAdminAuditLogsAction(
  input: AdminAuditLogQuery,
): Promise<AdminActionResult<AdminAuditLogListResponse>> {
  const query = adminAuditLogQuerySchema.safeParse(input);
  return query.success
    ? execute(() => listAdminAuditLogs(query.data))
    : invalid<AdminAuditLogListResponse>();
}
