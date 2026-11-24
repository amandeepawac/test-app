# RozgarLocal --- Product Requirements Document (PRD)

> **Document status:** Draft for MVP implementation\
> **Product:** RozgarLocal\
> **Version:** 1.0\
> **Prepared:** 23 November 2026\
> **Primary market:** Punjab, India\
> **Expansion:** India-wide after validating the Punjab launch

---

## 1. Product overview

RozgarLocal is a responsive web application and installable Progressive
Web App (PWA) that connects local job seekers with employers. It is
designed initially for blue-collar, frontline, and other local
employment opportunities, with a Punjab-first launch strategy and a path
to expand across India.

The product provides a simple way for employers to publish and manage
vacancies and for job seekers to discover relevant work, maintain a
profile, and apply. The MVP also includes employer verification,
application tracking, notifications, and administrative moderation.

The product will be free initially.

### 1.1 Product vision

Make local employment discovery and hiring easier, more accessible, and
more trustworthy by giving job seekers and employers a simple digital
platform that works well on mobile devices and supports Punjabi, Hindi,
and English.

### 1.2 Product principles

1.  **Mobile-first:** Most user journeys must work comfortably on a
    phone.
2.  **Low friction:** Keep registration, job discovery, and applying
    straightforward.
3.  **Trust and safety:** Verify employers and provide reporting and
    moderation tools.
4.  **Local relevance:** Start with Punjab and support location-based
    discovery.
5.  **Accessible language:** Support Punjabi, Hindi, and English.
6.  **Maintainable engineering:** Use a modular monolith and shared
    validation/types rather than premature microservices.

---

## 2. Goals and success measures

### 2.1 MVP goals

- Allow job seekers to register, verify their email, create a profile,
  search jobs, save jobs, and apply.
- Allow employers to register, create an employer profile, submit
  verification information, publish jobs, and manage applications.
- Allow employers to review applicants and update application
  statuses.
- Give users visibility into their application history and status.
- Allow administrators to review employer verification requests,
  moderate jobs, and investigate reports.
- Deliver a responsive, installable PWA with Punjabi, Hindi, and
  English UI support.
- Establish a secure authentication foundation supporting
  email/password and Google sign-in.

### 2.2 Suggested MVP metrics

These are proposed product metrics; establish baselines after launch.

---

Area Metric

---

Acquisition New job seeker registrations

Employer supply Employer registrations and verified
employers

Marketplace supply Active jobs and jobs published per
verified employer

Engagement Weekly active job seekers and
employers

Job discovery Search-to-job-detail click-through
rate

Conversion Job-detail-to-application
conversion rate

Hiring activity Applications per active job

Marketplace health Time from job publication to first
application

Trust Reports per 100 active jobs;
moderation resolution time

Reliability API availability, error rate, and
key journey completion rate
-----------------------------------------------------------------------

---

## 3. Target users and roles

### 3.1 Job seeker

A person looking for local employment. The user should be able to create
a profile, browse and filter jobs, save interesting jobs, apply, and
track application progress.

### 3.2 Employer

A business or individual authorized to publish vacancies. The employer
creates an employer profile, submits verification details, creates job
listings, and manages applications.

### 3.3 Administrator / moderator

An internal platform operator who reviews employer verification,
moderates job listings, handles user reports, and reviews relevant audit
records.

### 3.4 Account and authorization principles

- A user account is the identity boundary.
- Authentication provider information is kept separately from the user
  profile through `UserAuthProvider`.
- A user may authenticate using email/password, Google, or both when
  linked safely.
- Application permissions must be enforced by the API, not only by
  hiding UI controls.
- Job seekers must not manage employer-only resources unless they also
  have the required authorization.
- Administrative actions must be permission-protected and auditable.

> **Schema alignment note:** The repository's
> [Prisma schema](../packages/db/prisma/schema.prisma) and
> [table reference](./database/tables/README.md) describe the intended
> database. The web and API are currently starter applications; schema
> models do not imply that these product features are implemented.

---

## 4. Scope

### 4.1 In scope for MVP

- Responsive web application and PWA installation.
- Email/password registration and login.
- Google authentication.
- Email verification.
- Forgot-password and reset-password flows.
- Session management and refresh-token rotation.
- Job seeker profile management.
- Employer profile creation and verification workflow.
- Job creation, editing, publishing, pausing, filling, and expiry
  handling.
- Public job discovery and job detail pages.
- Search and filters.
- Saved jobs.
- Job applications and application history.
- Employer applicant management.
- Application status updates.
- In-app notifications and essential email notifications.
- Job and user reporting.
- Admin moderation tools.
- Punjabi, Hindi, and English interface localization.
- Basic PWA caching and offline-friendly read experience.

### 4.2 Out of scope for the first MVP

Unless separately approved, do not make these launch blockers:

- Native Android or iOS applications.
- Paid subscriptions, employer credits, or job-posting fees.
- Online payments or payroll.
- Real-time chat or voice/video calls.
- Complex applicant ranking or AI-based matching.
- Resume parsing and automated candidate scoring.
- Fully offline job applications or offline data submission.
- Multi-company enterprise tenancy and advanced HR integrations.

---

## 5. Functional requirements

Priority definitions:

- **P0:** Required for the MVP launch.
- **P1:** Important; implement after the core journey is stable.
- **P2:** Future enhancement.

### 5.1 Authentication and account security

---

ID Requirement Priority

---

AUTH-01 A visitor can register P0
using name, email, and  
password.

AUTH-02 A user can sign in P0
using email and  
password.

AUTH-03 A user can sign in P0
using Google.

AUTH-04 The system sends an P0
email verification link
or token after email  
registration.

AUTH-05 The system supports P0
resend verification  
with abuse protection.

AUTH-06 A user can request a P0
password-reset email.

AUTH-07 A user can reset their P0
password using a valid,
single-use, expiring  
reset token.

AUTH-08 Authenticated sessions P0
can be refreshed  
securely.

AUTH-09 Refresh tokens are P0
stored hashed and  
rotated on use.

AUTH-10 A user can log out and P0
revoke the current  
session.

AUTH-11 Password reset and P0
security-sensitive  
events revoke  
applicable  
sessions/tokens.

AUTH-12 Provider identities are P0
stored separately using
`UserAuthProvider`;  
retain the  
`AuthProvider` enum.

AUTH-13 Authentication errors P0
avoid revealing whether
an email address is  
registered.

AUTH-14 Authentication P0
endpoints are  
rate-limited and  
protected against brute
force and token replay.
-----------------------------------------------------------------------

**Confirmed authentication design decisions**

- Supported providers: `EMAIL_PASSWORD` and `GOOGLE`.
- Retain the `AuthProvider` enum.
- Use a separate `UserAuthProvider` model rather than placing all
  provider identity data directly on `User`.
- Recommended unique constraints for provider identity:
  `[provider, providerUserId]` and `[userId, provider]`.
- Use the Google subject for Google identities and the account UUID as
  text for email/password identities. Create the identity and password
  credential atomically, and verify identity ownership before linking.
- Keep password credentials separate from provider identity records.
- Store password hashes using Argon2id.
- Store verification, reset, and refresh tokens as hashes; use
  single-use and expiry rules where applicable.
- Use short-lived JWT access tokens and rotating refresh tokens.
- Support session revocation and session-aware logout.

### 5.2 Job seeker profile

---

ID Requirement Priority

---

SEEK-01 A job seeker can create P0
and edit a profile.

SEEK-02 A profile can contain P0
name and contact  
details.

SEEK-03 A profile can contain P0
location information  
relevant to local job  
discovery.

SEEK-04 A profile can contain P0
skills and work  
experience.

SEEK-05 A profile can P1
optionally include  
education and a profile
image.

SEEK-06 A job seeker can review P0
their submitted  
applications and  
current statuses.

SEEK-07 A job seeker can save P0
and unsave jobs.

SEEK-08 A job seeker can P0
withdraw an application
where the application  
state permits it.
-----------------------------------------------------------------------

The final set of required profile fields should be kept lean. Do not
force a long resume-style profile before allowing a user to discover
jobs.

### 5.3 Employer profile and verification

---

ID Requirement Priority

---

EMP-01 A user with employer P0
permissions can create  
an employer profile.

EMP-02 The employer profile P0
captures business  
identity and contact  
information.

EMP-03 An employer can submit P0
required information  
for verification.

EMP-04 An administrator can P0
approve or reject a  
verification request.

EMP-05 The employer can see P0
verification status and
relevant feedback.

EMP-06 Only appropriately P0
authorized employers  
can publish jobs.

EMP-07 Employer profile P1
information can be  
updated, with sensitive
changes subject to  
re-review where  
required.
-----------------------------------------------------------------------

Define the exact verification evidence and manual review policy before
implementing the admin workflow. Do not assume a particular government
identity document is mandatory until that policy is approved.

### 5.4 Job posting and lifecycle

A job listing should support the following business information, subject
to the exact Prisma schema:

- Job title and description.
- Category and required skills.
- Salary minimum and maximum, plus salary period.
- Employment type.
- Number of vacancies.
- Job location.
- Required experience.
- Working hours or shift information.
- Expiry date.
- Publication status.

---

ID Requirement Priority

---

JOB-01 An authorized employer P0
can create a job draft.

JOB-02 An employer can edit its P0
own draft or eligible  
active listing.

JOB-03 An employer can submit a P0
job for  
publication/moderation  
where required.

JOB-04 The system supports job P0
pause, filled, expiry,  
and rejection states.

JOB-05 A job seeker can view P0
active published jobs.

JOB-06 A job seeker can filter P0
jobs by location,  
category, employment  
type, and salary where  
data exists.

JOB-07 A job seeker can search P0
by job title or relevant
keywords.

JOB-08 Expired, paused, P0
rejected, and draft jobs
are not shown as active  
public vacancies.

JOB-09 Employers can see and P0
manage their own job  
listings.

JOB-10 The system records P1
relevant job lifecycle  
changes.
------------------------------------------------------------------------

**Schema job status values:** `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`,
`PAUSED`, `REJECTED`, `CLOSED`, `FILLED`, `EXPIRED`, `REMOVED`.
`FILLED` denotes a filled vacancy; `CLOSED` covers other closures.

Implement allowed transitions explicitly. For example, a rejected job
must not become publicly visible simply because a client sends
`status: PUBLISHED`.

### 5.5 Job discovery

---

ID Requirement Priority

---

DISC-01 Visitors can browse P0
public active jobs.

DISC-02 Users can search by P0
keyword.

DISC-03 Users can filter by P0
location.

DISC-04 Users can filter by job P0
category and employment
type.

DISC-05 Users can filter by P1
salary range when  
salary data is  
provided.

DISC-06 Job results are P0
paginated.

DISC-07 Job details show P0
employer, location,  
salary (if provided),  
requirements, and  
application action.

DISC-08 Empty, loading, and P0
error states are  
designed for search  
results.
-----------------------------------------------------------------------

For the Punjab launch, location search should support the location
granularity agreed in the data model (for example, city/district/state).
Avoid hardcoding Punjab-only assumptions into the database so expansion
to other Indian states remains possible.

### 5.6 Applications and application history

---

ID Requirement Priority

---

APP-01 An authenticated job P0
seeker can apply to an  
active eligible job.

APP-02 The system prevents P0
duplicate applications by the same job seeker for the same job.

APP-03 The job seeker can view P0
their application  
history.

APP-04 The employer can view P0
applicants for its own  
jobs.

APP-05 The employer can update P0
an application status  
using allowed  
transitions.

APP-06 The system records P0
application status  
history.

APP-07 The job seeker can P0
withdraw an application
where allowed.

APP-08 Relevant status changes P0
generate notifications.
-----------------------------------------------------------------------

**Schema application status values:** `APPLIED`, `REVIEWING`,
`SHORTLISTED`, `CONTACTED`, `REJECTED`, `HIRED`, `WITHDRAWN`.
The unique job/seeker pair allows one application record per job even
after withdrawal. Decide whether reapplying may reactivate that record
before implementing the transition rules.

The application history must preserve who changed a status, the previous
and new status, and when the change occurred, according to the final
schema design.

### 5.7 Notifications

---

ID Requirement Priority

---

NOT-01 Users receive an in-app P0
notification for  
relevant application  
events.

NOT-02 Job seekers are P0
notified when their  
application status  
changes.

NOT-03 Employers are notified P0
about new applications  
to their jobs.

NOT-04 Users can mark P1
notifications as read.

NOT-05 Essential P0
authentication emails  
are sent for  
verification and  
password reset.

NOT-06 Notification delivery P1
failures are logged and
retried safely where  
appropriate.
-----------------------------------------------------------------------

Push notifications may be added as a PWA enhancement after the core
in-app and email notification flows work reliably.

### 5.8 Reports, moderation, and administration

---

ID Requirement Priority

---

MOD-01 A user can report a P0
suspicious job or  
inappropriate content.

MOD-02 An administrator can P0
view and triage  
reports.

MOD-03 An administrator can P0
review employer  
verification  
submissions.

MOD-04 An administrator can P0
approve or reject  
employer verification.

MOD-05 An administrator can P0
review, reject, or  
remove problematic job  
listings.

MOD-06 Administrative actions P0
are recorded in audit  
logs.

MOD-07 Admin routes and P0
operations require  
explicit authorization.
-----------------------------------------------------------------------

Define moderation reason codes, evidence retention, escalation rules,
and response expectations before launch.

---

## 6. Core user journeys

### 6.1 Job seeker journey

1.  Visitor opens the website or PWA.
2.  Visitor browses public jobs or creates an account.
3.  User registers with email/password or Google.
4.  Email/password registrant verifies their email.
5.  User completes the essential job seeker profile.
6.  User searches or filters jobs by keyword, location, and category.
7.  User opens a job detail page.
8.  User saves the job or applies.
9.  System confirms the application and records `APPLIED`.
10. Employer reviews the application and updates its status.
11. Job seeker receives a notification and checks application history.
12. Job seeker may withdraw if the current state permits it.

### 6.2 Employer journey

1.  Visitor registers or signs in.
2.  User creates an employer profile.
3.  Employer submits verification information.
4.  Admin reviews the submission.
5.  Employer sees approval/rejection and any feedback.
6.  Verified/authorized employer creates a job draft.
7.  Employer submits the job for publication/moderation if required.
8.  Job becomes active when approved and published.
9.  Employer views applicants.
10. Employer updates application statuses.
11. Employer closes, pauses, or marks a job filled when appropriate.

### 6.3 Admin journey

1.  Admin signs in using an authorized account.
2.  Admin opens pending employer verifications.
3.  Admin reviews evidence and approves or rejects the submission.
4.  Admin reviews reported jobs/users and pending job moderation.
5.  Admin takes an action with a reason.
6.  System writes an audit record.
7.  Relevant user receives an appropriate notification.

---

## 7. UX, localization, and PWA requirements

### 7.1 Responsive experience

- Design mobile-first.
- Support common phone, tablet, and desktop widths.
- Keep job search and application actions easy to reach on mobile.
- Use accessible labels, focus states, and keyboard navigation.
- Provide clear loading, empty, validation, success, and error states.

### 7.2 Languages

The MVP must support:

- Punjabi
- Hindi
- English

Requirements:

- Keep UI copy in translation resources, not hardcoded throughout
  components.
- Store the user's preferred locale.
- Provide a language selector.
- Ensure fonts and layouts render Punjabi and Devanagari text
  correctly.
- Do not assume job descriptions are available in all three languages;
  user-generated content should be displayed as submitted.

The current web shell defaults to English and stores the selected language
in a browser cookie without changing URLs. Account-level preference
synchronization is not implemented; reconcile the account default and
cookie preference when profiles are built.

### 7.3 PWA

- Provide a web app manifest and installability.
- Use a service worker for appropriate static asset and read-only
  caching.
- Show a clear offline state.
- Do not claim an application was submitted when the device is
  offline.
- Do not queue application submissions offline for automatic replay in
  the MVP.
- Consider push notifications after the core notification service is
  stable.

---

## 8. Non-functional requirements

### 8.1 Security

- Hash passwords with Argon2id.
- Hash refresh and single-use tokens at rest.
- Rotate refresh tokens and detect reuse where supported by the
  session design.
- Use short-lived access tokens.
- Enforce authorization on every protected API operation.
- Validate and normalize inputs at the API boundary.
- Rate-limit authentication, verification, reset, reporting, and other
  abuse-prone endpoints.
- Protect against common web vulnerabilities, including XSS, CSRF
  where cookie-based auth is used, SQL injection, and insecure direct
  object references.
- Avoid logging passwords, tokens, or sensitive verification
  documents.
- Keep secrets in environment/secret management, never in source
  control.

### 8.2 Performance and reliability

- Paginate job search and application lists.
- Index common filters and foreign-key relationships according to
  actual query patterns.
- Avoid N+1 query patterns.
- Use background processing for email and other retryable work when
  the queue infrastructure is introduced.
- Monitor API errors and key journey failures.
- Set explicit performance targets before public launch and validate
  them under realistic load.

### 8.3 Data integrity

- Use database constraints for uniqueness and referential integrity.
- Use transactions for multi-record operations such as application
  creation plus history creation.
- Enforce application/job ownership in service logic.
- Enforce legal state transitions in backend services.
- Keep audit/history records for important state changes.
- Define deletion, retention, and anonymization policies before
  production launch.

### 8.4 Accessibility

- Use semantic HTML.
- Ensure forms have labels and useful validation messages.
- Support keyboard navigation and visible focus.
- Maintain readable contrast and touch target sizes.
- Avoid relying on color alone to communicate status.

---

## 9. Technology stack and architecture

### 9.1 Confirmed stack

Layer Technology

---

Monorepo Turborepo
Web application Next.js
Backend API NestJS
Language TypeScript
Styling Tailwind CSS
UI components shadcn/ui
Validation Zod
ORM Prisma
Database PostgreSQL
Authentication Email/password + Google
API style REST
API documentation Swagger / OpenAPI
Client state Zustand
Server state TanStack Query
Unit/integration testing Vitest
End-to-end testing Playwright

### 9.2 Architecture approach

Use a **modular monolith** for the MVP:

- One Next.js web application.
- One NestJS API application.
- One PostgreSQL database.
- Clearly separated backend modules.
- Shared packages for types, validation schemas, and common
  configuration.
- No microservices until scale or independent deployment needs justify
  them.

### 9.3 Suggested monorepo layout

```text
rozgarlocal/
├── apps/
│   ├── web/                  # Next.js App Router
│   └── api/                  # NestJS REST API
├── packages/
│   ├── ui/                   # Shared UI components (if needed)
│   ├── types/                # Shared TypeScript types
│   ├── validation/           # Shared Zod schemas
│   ├── config/               # Shared lint/TS configuration
│   └── utils/                # Framework-agnostic utilities
├── packages/db/prisma/       # Prisma schema and migrations
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── API.md
├── package.json
├── turbo.json
└── ...
```

Keep Prisma ownership clear: the API should own database access. The web
app should call the API rather than importing Prisma or connecting
directly to PostgreSQL.

### 9.4 Suggested NestJS modules

- `AuthModule`
- `UsersModule`
- `JobSeekerModule` or profile module
- `EmployersModule`
- `EmployerVerificationModule`
- `JobsModule`
- `JobSearchModule` (may initially be part of `JobsModule`)
- `ApplicationsModule`
- `SavedJobsModule`
- `NotificationsModule`
- `ReportsModule`
- `ModerationModule`
- `AdminModule`
- `AuditModule`

Use the final Prisma schema as the source of truth for entity names and
relations. Module boundaries are application boundaries and do not
require one module per database table.

---

## 10. API surface (initial proposal)

Use versioned REST routes, for example `/api/v1`.

---

Area Example endpoints

---

Authentication `POST /auth/register`, `POST /auth/login`,
`POST /auth/google`, `POST /auth/refresh`,
`POST /auth/logout`

Email verification `POST /auth/email/verify`,
`POST /auth/email/resend`

Password reset `POST /auth/password/forgot`,
`POST /auth/password/reset`

Current user `GET /users/me`, `PATCH /users/me`

Job seeker profile `GET /job-seeker/profile`,
`PUT /job-seeker/profile`

Employers `POST /employers`, `GET /employers/me`,
`PATCH /employers/me`

Employer verification `POST /employers/me/verification`,
`GET /employers/me/verification`

Jobs `POST /jobs`, `GET /jobs`, `GET /jobs/:jobId`,
`PATCH /jobs/:jobId`

Employer job management `GET /employers/me/jobs`,
`POST /jobs/:jobId/publish`,
`POST /jobs/:jobId/pause`

Saved jobs `GET /saved-jobs`, `PUT /saved-jobs/:jobId`,
`DELETE /saved-jobs/:jobId`

Applications `POST /jobs/:jobId/applications`,
`GET /applications/me`,
`GET /jobs/:jobId/applications`

Application status `PATCH /applications/:applicationId/status`,
`POST /applications/:applicationId/withdraw`

Notifications `GET /notifications`,
`PATCH /notifications/:notificationId/read`

Reports `POST /reports`, admin report listing and
moderation endpoints

Admin Employer verification and job moderation
endpoints
----------------------------------------------------------------------------------

These are proposed route shapes, not confirmed existing endpoints.
Finalize request/response contracts with Zod schemas and Swagger
definitions before frontend integration.

---

## 11. Development plan: recommended implementation order

Build vertical slices in dependency order. Do not build every screen
first and postpone backend integration. Each phase should end with a
working, tested increment.

### Phase 0 --- Confirm the baseline

**Deliverables** - Review the repository Prisma schema and migrations,
including field names, relations, constraints, and indexes. - Confirm
the MVP state transitions for jobs and applications. - Confirm
employer verification policy and required evidence. - Confirm the
required profile fields and location hierarchy. - Record unresolved
decisions in an architecture decision log.

**Exit criteria** - PRD and Prisma schema do not contradict each
other. - No guessed database fields or enum values remain in
implementation tickets.

### Phase 1 --- Monorepo and developer foundation

**Build** 1. Create the Turborepo workspace. 2. Add `apps/web` using
Next.js App Router. 3. Add `apps/api` using NestJS. 4. Configure
TypeScript, linting, formatting, environment validation, and path
aliases. 5. Add shared `types`, `validation`, and `config` packages. 6.
Configure local PostgreSQL and Prisma. 7. Add migration and seed
workflows. 8. Add CI checks for lint, typecheck, tests, and build.

**Exit criteria** - `web` and `api` run locally. - API health endpoint
works. - Prisma connects to PostgreSQL. - A migration can be applied to
a clean database. - CI runs successfully.

### Phase 2 --- Database and authentication foundation

**Build** 1. Implement the confirmed Prisma schema and first migration. 2. Seed only essential reference data, such as approved categories and
supported locales, if these are part of the agreed model. 3. Implement
email/password registration and login. 4. Implement Argon2id password
hashing. 5. Implement email verification and resend flow. 6. Implement
forgot-password and reset-password flows. 7. Implement Google sign-in
and safe account/provider linking. 8. Implement `UserAuthProvider` and
retain `AuthProvider`. 9. Implement access tokens, hashed rotating
refresh tokens, session records, logout, and revocation. 10. Add auth
rate limits and security tests. 11. Add Swagger documentation.

**Exit criteria** - Registration, verification, login, Google login,
refresh, logout, and reset work end to end. - Refresh-token rotation and
reuse/revocation behavior are tested. - Protected API routes reject
unauthenticated and unauthorized requests.

### Phase 3 --- User profiles and employer verification

**Build** 1. Implement current-user profile retrieval and updates. 2.
Implement job seeker profile creation and editing. 3. Implement employer
profile creation and editing. 4. Implement employer verification
submission. 5. Implement admin verification review and decision. 6. Add
role/ownership guards and audit events. 7. Build the corresponding web
forms and dashboards.

**Exit criteria** - A job seeker can complete the minimum profile. - An
employer can submit verification. - An admin can approve/reject it. -
Unverified employers cannot bypass publication authorization.

### Phase 4 --- Job posting and discovery

**Build** 1. Implement job draft creation and editing. 2. Implement
server-side job lifecycle transitions. 3. Implement
publication/moderation rules. 4. Implement public active-job listing. 5.
Implement job detail endpoint and page. 6. Implement keyword search,
location/category filters, pagination, and sorting. 7. Implement
employer job dashboard. 8. Add expiry handling and tests.

**Exit criteria** - An authorized employer can create and manage jobs. -
Public users see only eligible published jobs. - Search and filters work
against PostgreSQL. - Job state transitions cannot be bypassed through
direct API calls.

### Phase 5 --- Applications and saved jobs

**Build** 1. Implement apply-to-job endpoint. 2. Enforce
duplicate-application prevention. 3. Write application and initial
history atomically. 4. Implement job seeker application history. 5.
Implement employer applicant list. 6. Implement status transition rules
and status history. 7. Implement withdrawal rules. 8. Implement
saved-job add/remove/list. 9. Add ownership and authorization tests.

**Exit criteria** - Job seeker can apply and track status. - Employer
can review applicants and update statuses. - Duplicate applications and
unauthorized access are prevented. - Every status change has a history
record.

### Phase 6 --- Notifications and moderation

**Build** 1. Implement in-app notification records and listing. 2.
Trigger notifications for new applications and status changes. 3.
Complete essential authentication email templates. 4. Implement report
submission. 5. Implement admin report queue and actions. 6. Implement
job moderation. 7. Add audit-log review. 8. Add retry/error handling for
notification delivery.

**Exit criteria** - Users receive the correct notifications for core
events. - Reports can be submitted and resolved by an authorized
admin. - Moderation actions are auditable.

### Phase 7 --- PWA, localization, and UX completion

**Build** 1. Complete responsive layouts for job seeker and employer
journeys. 2. Add Punjabi, Hindi, and English translations. 3. Add
language preference persistence. 4. Add PWA manifest and service worker. 5. Cache static assets and safe read-only content. 6. Add explicit
offline and retry states. 7. Verify no offline application is falsely
reported as submitted. 8. Run accessibility and mobile usability
reviews.

**Exit criteria** - Core journeys work on mobile and desktop. - Language
switching works across the application. - PWA can be installed on
supported devices. - Offline behavior is clear and does not lose or fake
submissions.

### Phase 8 --- Testing, hardening, and launch

**Build** 1. Unit tests for services and domain rules. 2. API
integration tests against a test PostgreSQL database. 3. Playwright
end-to-end tests for all three roles. 4. Security review of
authentication and authorization. 5. Load test job search and
application endpoints. 6. Verify backups, migrations, logs, monitoring,
and error reporting. 7. Add production environment configuration and
deployment pipeline. 8. Run a controlled Punjab pilot with a small set
of employers and job seekers. 9. Fix pilot feedback before broad
promotion.

**Exit criteria** - Critical user journeys pass end-to-end. - No known
critical/high security defects remain. - Production migration and
rollback/restore procedures are documented. - Support and moderation
processes are ready.

---

## 12. Recommended first development sprint

Start with the foundation, not the landing page or all dashboards.

### Sprint 1 --- Engineering foundation

1.  Create the Turborepo repository and workspace scripts.
2.  Scaffold Next.js and NestJS applications.
3.  Configure shared TypeScript and linting.
4.  Configure PostgreSQL and Prisma.
5.  Add environment variable validation.
6.  Add a health endpoint and a basic web shell.
7.  Add CI for lint, typecheck, test, and build.
8.  Verify a clean clone can be installed and run using the README.

**Sprint demo:** A developer can clone the repo, start the database, run
migrations, start the API and web app, and see the API health status
from the web development environment.

### Sprint 2 --- Authentication

1.  Implement registration and password hashing.
2.  Implement email verification.
3.  Implement login and access-token issuance.
4.  Implement refresh-token rotation and session persistence.
5.  Implement logout and session revocation.
6.  Add auth UI and validation.
7.  Add integration tests.

**Sprint demo:** A user can register, verify email, log in, refresh a
session, and log out.

### Sprint 3 --- Google auth and account recovery

1.  Implement Google OAuth.
2.  Implement safe provider linking.
3.  Implement forgot-password and reset-password.
4.  Add resend verification protections.
5.  Add rate limiting and security tests.

**Sprint demo:** Email/password and Google authentication work with
account recovery and session revocation.

Continue to profiles and employer verification only after the
authentication foundation is stable.

---

## 13. Testing strategy

### Unit tests (Vitest)

Prioritize: - Password and token services. - Auth provider linking
rules. - Job state transition rules. - Application state transition
rules. - Duplicate application rules. - Authorization policy helpers. -
Zod validation schemas.

### API integration tests

Prioritize: - Registration, verification, login, refresh, logout, and
reset. - Employer verification approval/rejection. - Job creation and
publication authorization. - Search filters and pagination. -
Application creation and duplicate prevention. - Application status
history. - Report submission and admin moderation.

### End-to-end tests (Playwright)

Minimum critical scenarios: 1. Job seeker registers, verifies email,
completes profile, searches, and applies. 2. Employer registers, creates
a profile, submits verification, and receives approval. 3. Verified
employer creates a job and reviews an application. 4. Employer updates
application status and job seeker sees the update. 5. Admin rejects a
reported job and the action is audited. 6. User resets password and old
sessions are revoked as specified.

---

## 14. Risks and decisions to close

---

Topic Risk / open decision Recommended next action

---

Schema and deployment The repository schema may differ from a deployed
database. Check migration status and drift against the target database
before deployment; use the repository schema as the intended model.

Employer verification Required evidence and approval policy Define acceptable
are not fully specified here. evidence, reviewer
checklist, and
rejection reasons.

Job moderation Whether every job requires approval Choose a launch policy
or only flagged jobs needs and encode allowed
confirmation. transitions.

Location model Exact state/district/city Confirm the location
representation must match the schema. hierarchy and
seed/reference-data
strategy.

Contact privacy Public visibility of phone/email Define what is visible
needs a product decision. before application and
after application.

Notifications Exact email provider, queue, and push Keep notification
strategy are not confirmed here. delivery behind a
service boundary;
choose infrastructure
before implementation.

PWA offline scope Offline application submission is Cache only safe
excluded. read-only content and
communicate offline
state clearly.

Data retention Retention for accounts, applications, Define retention and
reports, and verification evidence is deletion policy before
not specified. public launch.
-------------------------------------------------------------------------------------

---

## 15. Definition of MVP complete

The MVP is ready for a controlled launch when:

- [ ] Job seekers can register, verify, sign in, manage a profile,
      discover jobs, save jobs, apply, and track applications.
- [ ] Employers can register, create a profile, submit verification,
      publish/manage jobs after authorization, and manage applicants.
- [ ] Admins can review verification requests, moderate jobs, process
      reports, and inspect audit records.
- [ ] Job and application status transitions are enforced server-side.
- [ ] Authentication supports email/password and Google with secure
      session and refresh-token handling.
- [ ] Punjabi, Hindi, and English UI support is available.
- [ ] Responsive web and installable PWA behavior is validated.
- [ ] Critical unit, integration, and end-to-end tests pass.
- [ ] Production deployment, database backup, monitoring, and support
      procedures are ready.
- [ ] A Punjab pilot has validated the core hiring journey.

---

## 16. Immediate next actions

1.  Verify migration status and drift against the target database before
    deploying schema changes.
2.  Resolve the open decisions in Section 14, especially employer
    verification and job moderation.
3.  Create `docs/PRD.md` and `docs/ARCHITECTURE.md` in the monorepo.
4.  Convert Phases 1--3 into small issues with acceptance criteria.
5.  Start Sprint 1: Turborepo, Next.js, NestJS, PostgreSQL, Prisma,
    shared packages, and CI.
6.  Do not start the full UI before the API contracts and core domain
    rules are agreed.

**Recommended build order:** foundation → authentication → profiles and
employer verification → job posting and discovery → applications →
notifications and moderation → PWA/localization polish → hardening and
Punjab pilot.
