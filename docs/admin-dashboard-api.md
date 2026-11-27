# Admin APIs

## `GET /admin/dashboard`

Returns an administrative overview and the ten most recent audit events. The response is marked `Cache-Control: no-store`.

Authentication requires a valid access token in the `Authorization: Bearer <token>` header and an account whose primary role is `ADMIN`. Missing or invalid sessions receive `401`; authenticated non-admin users receive `403`.

The response contains:

- `users`: non-deleted user total, totals by primary role, and suspended users.
- `jobs`: total listings, published listings, and listings awaiting review.
- `employerVerifications`: pending, under-review, and needs-more-information counts.
- `reports`: open and under-review counts.
- `recentActivity`: the newest audit events, including action, entity, timestamp, and optional actor.

All list endpoints below are paginated with `page` (default `1`) and `pageSize` (default `25`, maximum `100`). They use the same admin authentication and `Cache-Control: no-store` behavior.

## Employer verification

- `GET /admin/employer-verifications?status=PENDING` lists the pending review queue. By default it includes `PENDING` and `UNDER_REVIEW`.
- `GET /admin/employer-verifications/:id` returns employer details and submitted document metadata.
- `PATCH /admin/employer-verifications/:id/documents/:documentId` approves or rejects a pending document. Rejection requires a note.
- `PATCH /admin/employer-verifications/:id` accepts `UNDER_REVIEW`, `APPROVE`, `REJECT`, or `NEEDS_MORE_INFO`. Rejection and more-information decisions require a note.

Approval is blocked while any submitted documents remain pending review. Final decisions, audit records, and employer notifications are written together.

## Job moderation

- `GET /admin/jobs` lists all jobs; an optional `status` filters the list.
- `GET /admin/jobs/:id` returns listing details and employer contact details.
- `PATCH /admin/jobs/:id/moderation` accepts `HIDE`, `RESTORE`, or `REMOVE`, with a required reason. Hiding applies to published jobs; only an admin can restore a hidden job. Restoration requires a completed, verified employer and an unexpired job. Removal also applies to hidden jobs. Legacy `APPROVE` and `REJECT` decisions apply to jobs pending review; approval requires a verified employer and an unexpired job.

Moderation state changes, audit records, and employer notifications are written together.

## Report triage

- `GET /admin/reports?status=OPEN` lists reports awaiting triage. By default it includes `OPEN` and `UNDER_REVIEW`.
- `GET /admin/reports/:id` returns the report, reporter, and available target details.
- `PATCH /admin/reports/:id` changes the status to `OPEN`, `UNDER_REVIEW`, `ACTION_TAKEN`, `DISMISSED`, or `CLOSED`, with a required review note. Closed reports cannot be reopened; completed/dismissed reports can be returned to review.

Status changes are audited; the reporter is notified when a report is resolved.

## Audit logs

- `GET /admin/audit-logs` supports filters for `actorId`, `action`, `entityType`, `entityId`, `from`, and `to`, in addition to pagination.

These APIs do not add general user suspension or role-management operations. The PRD does not define their authorization policy or state transitions; define those before exposing user-management endpoints.

Moderation reasons are currently bounded free text. The PRD calls for approved reason codes, evidence-retention rules, and escalation policies before launch; these API contracts should be updated once those policies are decided.
