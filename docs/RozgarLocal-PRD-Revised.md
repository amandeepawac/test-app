# RozgarLocal Revised Product Requirements Document

**Purpose:** Reconcile the current product requirements with the high-level solution architecture and the implementation present in the repository. This document defines the product problem, the MVP that will address it, what is already implemented, and what remains before a pilot.

| Document field   | Value                                                                                |
| ---------------- | ------------------------------------------------------------------------------------ |
| Product          | RozgarLocal                                                                          |
| Version          | 2.0 revised baseline                                                                 |
| Prepared         | 27 November 2026                                                                     |
| Status updated   | 28 November 2026                                                                     |
| Market           | Punjab, India                                                                        |
| Languages        | Punjabi, Hindi, English                                                              |
| Status           | Product baseline for review; implementation and launch validation remain in progress |
| Sources compared | Previous PRD (available in Git history) and `RozgarLocal_Solution_Architecture_and_Design.docx` |

## 1. Executive summary

RozgarLocal addresses a local hiring problem: job seekers often cannot find trustworthy nearby vacancies, while small employers rely on word of mouth and fragmented channels to reach suitable workers. The MVP must prove a complete, safe hiring loop in a defined Punjab pilot: an employer creates a business profile, passes verification, publishes a vacancy, a job seeker discovers and applies to it, and the employer can review and update the application while both sides receive clear status feedback.

The repository contains authentication, role-specific profiles, employer verification evidence intake, public job discovery, and application and employer-review code. Saved jobs have API and contract code but no user interface. These slices have not yet been validated as an end-to-end marketplace; report intake and a user-facing notification inbox are still missing. A database model, screen, or API for one slice is not counted as a completed user journey.

This revised PRD keeps the MVP deliberately focused. It retains the current single-role account behavior, email/password plus Google authentication, and the state/city profile location flow. It makes the architecture's alternative proposals explicit, identifies which are deferred, and prioritizes the missing transaction flows that directly solve the local hiring problem.

## 2. The problem and product outcome

### 2.1 Problem statement

Local workers, shop owners, contractors, and small businesses may have difficulty reaching one another through a reliable, searchable channel. Job seekers may not know which nearby businesses are hiring. Smaller employers may have limited ways to find suitable local candidates outside existing contacts. Informal hiring can also make it harder to evaluate whether a vacancy or employer is trustworthy and to understand what happened after applying.

### 2.2 Product outcome

RozgarLocal will provide one accessible marketplace where people can find local vacancies and employers can reach and manage local candidates. The MVP succeeds when a pilot cohort can complete the hiring loop with location-relevant listings, trustworthy employer status, clear application state, and usable mobile and multilingual interfaces.

### 2.3 Product principles

1. **Local first:** Begin in Punjab. Use canonical state and city values for the current profile flow and keep the data model extensible to other Indian states.
2. **Mobile first and low friction:** Support phone-sized screens, clear forms, and a short path from job discovery to applying.
3. **Trust with clear boundaries:** Phone or email access proves control of a contact method; it does not verify a business. Employer verification and job moderation are separate controls.
4. **Privacy by default:** Keep seeker contact information private except for the specific authorized employer audience the user permits.
5. **A usable core before advanced matching:** Validate listings, applications, and hiring feedback before adding proximity ranking, recommendations, or paid placement.
6. **Language inclusion:** Support Punjabi, Hindi, and English for interface text. Display user-created job content in its original language.
7. **One deployable backend to start:** Use the NestJS modular monolith and clear capability boundaries; consider service extraction only when there is a demonstrated operational need.

## 3. MVP scope and exclusions

### 3.1 MVP launch scope

- Responsive web experience for visitors, job seekers, employers, and administrators.
- Email/password registration and sign-in, email verification, Google sign-in, password recovery, session refresh, and logout.
- One public role per account in the MVP: job seeker or employer. Role selection is fixed at registration.
- Minimum job seeker and employer profiles, profile completion, and private-by-default contact controls.
- Employer verification submission with private evidence handling, review, feedback, and resubmission.
- Employer job creation, editing, publication, pause, close/fill, and expiry behavior, gated by verification.
- Public job search and details, with keyword, category, location, employment type, salary where available, sorting, and pagination.
- Save/unsave jobs; submit applications; prevent duplicates; withdraw when allowed; view application history.
- Employer applicant list and permitted application status updates with history.
- Admin verification review, job moderation, user reports, and audit records.
- In-app application notifications and essential email events, with failures visible and retry behavior defined.
- English, Hindi, and Punjabi UI; responsive internal workspaces; accessible loading, empty, error, validation, and success states.
- Production readiness sufficient for a limited Punjab pilot: monitored deployment, database backup and restore procedure, security review, and tested critical journeys.

### 3.2 Not part of the first MVP

- Native iOS or Android applications.
- Paid subscriptions, employer credits, paid placement, or payment processing.
- Payroll, attendance, employee management, or a full HRMS.
- Real-time chat, voice, or video calls.
- AI ranking, automated hiring decisions, resume parsing, or candidate scoring.
- Full offline job applications or automatic replay of offline submissions.
- Enterprise multi-tenant HR integrations.
- Radius/geospatial search, saved searches, personalized recommendations, and advanced search analytics.
- Phone OTP as a required sign-in method. Reconsider only after provider, delivery, cost, and recovery decisions are made.

## 4. Roles, identity, and access

### 4.1 Job seeker

Creates a profile, chooses skills and location, discovers public vacancies, saves jobs, applies, follows application status, controls contact visibility, and reports suspicious content.

### 4.2 Employer

Creates a business profile, submits evidence for verification, creates job drafts, publishes when verified, manages listings, reviews applicants, updates allowed application statuses, and reports platform abuse.

### 4.3 Administrator or moderator

Reviews business evidence, moderates jobs, handles submitted reports, applies authorized account restrictions, and reviews audit records. Privileged actions require explicit authorization and an audit trail.

### 4.4 Account policy

- The MVP account has one stable identity and one fixed public role selected during registration. A user cannot change or add a role through the MVP UI or API.
- Role-specific profiles remain separate from account identity. Authorization and resource ownership are enforced by the API on every protected operation.
- Google sign-in uses an existing account's role. Email matching alone must never link identities. Google linking to an existing account requires an authenticated, explicit linking flow and verified identity ownership.
- A verified user must complete the minimum profile for the selected role before using role-specific marketplace actions. Incomplete users can resume onboarding and use the authentication/session actions needed to do so.
- Current saved-jobs API code allows an incomplete or absent seeker profile and creates a profile when saving. This differs from the profile-completion requirement above and needs a product decision and alignment before the journey is accepted.
- An employer profile being complete does not mean that the employer is verified or may publish jobs.

## 5. Reconciliation of the architecture and the previous PRD

The architecture is a conceptual proposal, not proof of deployed or implemented behavior. Where the documents disagree, this revised baseline either chooses the MVP behavior or records the decision as pending. Do not implement an unresolved alternative as if it were approved.

| Topic                | Previous PRD / current code                                                                                                 | Architecture proposal                                                                                       | Revised baseline                                                                                                                                                                              | Status                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Core product problem | Product overview described a local marketplace, but did not lead with the specific discovery and fragmented hiring problem. | Names the difficulty of connecting local workers and small employers through informal channels.             | Use the architecture's problem statement and make the completed hiring loop the MVP outcome.                                                                                                  | Newly clarified                        |
| Account roles        | One fixed role per account; registration and API enforce the choice.                                                        | Account may have one or more roles; identity is separate from role profiles.                                | Keep single role for MVP to match current auth, onboarding, and access behavior. Revisit multi-role only with explicit migration and authorization design.                                    | Decision recorded; multi-role deferred |
| Sign-in              | Email/password and Google are the selected providers; email verification is implemented.                                    | Lists phone/email registration and OTP/password reset as alternatives; recommends confirming provider.      | Retain email/password and Google. Treat phone OTP as future work, not an MVP dependency. Email verification is distinct from business verification.                                           | Clarified                              |
| Location             | Current profile selectors use state and city. District is not required in the current profile flow.                         | Recommends state, district, locality, PIN code, and optional coordinates for search.                        | Keep state/city for minimum profiles. Include district/PIN as potential job discovery filters when canonical data and product need are validated; defer radius search.                        | Updated scope                          |
| Application method   | Previous PRD prioritizes in-platform applications.                                                                          | Mentions contact or apply and asks whether both are needed.                                                 | Use structured in-platform applications as the primary MVP path so status can be tracked. Direct contact or chat is not a substitute for application records.                                 | Decision recorded                      |
| Verification         | Review and evidence-intake code exists; secure reviewer file delivery remains pending.                                     | Recommends private object storage, signed access, separate verification workflow, and admin decision audit. | Preserve verification as a separate employer process. Require private evidence, authorized review, reasoned rejection, and resubmission before considering the flow complete.                 | Partial; validation pending            |
| Job publication      | The intended policy is verified employers publish without prior job approval; admins may hide/remove content.               | Leaves publication policy open and suggests a policy decision.                                              | Use the already specified verified-employer gate and post-publication moderation. Admin may hide, remove, and restore only according to explicit transitions.                                 | Decision recorded                      |
| Backend architecture | Modular monolith with Next.js, NestJS, PostgreSQL, Prisma, shared contracts.                                                | Same recommendation, plus explicit integration boundaries and optional worker/object storage.               | Keep the modular monolith. Keep web-to-API access; web must not connect directly to PostgreSQL. Add a worker only when reliable async delivery requires one.                                  | Aligned                                |
| PWA                  | A launch goal, but no complete PWA implementation is present.                                                               | Recommends installability and safe static/read-only offline caching.                                        | Treat installability and offline states as launch requirements only after core online journeys work; never queue applications offline.                                                        | Pending                                |
| API versioning       | Current routes are not prefixed with `/api/v1`; target route proposal was clearly marked as a proposal.                     | Recommends a consistent versioned REST prefix and OpenAPI.                                                  | Do not describe `/api/v1` as implemented. Decide migration/versioning policy before committing clients to a new public API contract; publish Swagger before integration is declared complete. | Pending decision                       |
| Notifications        | Authentication email and admin/application notification records exist; user inbox and reliable delivery are pending.       | Recommends in-app first, with email/SMS/push where justified.                                               | Complete in-app application notifications and essential email delivery with safe retry handling. SMS, push, and WhatsApp remain future options.                                               | Partial; validation pending            |
| Data and deployment  | Prisma schema and migrations exist; target database/seed validation and production operations remain pending.               | Adds private file storage, CI/CD, monitoring, backups, restore, and recovery expectations.                  | Treat schema models as design support only. Validate a clean database, seed, deployment pipeline, backups, monitoring, and restore before pilot.                                              | Expanded launch gate                   |

## 6. Functional requirements

Priority definitions: **P0** is required for the controlled MVP pilot; **P1** follows once the core loop is stable; **P2** is a future enhancement. Status labels describe repository evidence as of 28 November 2026: **Implemented in code**, **Partial**, **Pending**, or **Decision required**. “Implemented in code” does not mean production validated.

### 6.1 Authentication and account security

| ID      | Requirement                                                                                                 | Priority | Current status                                                              |
| ------- | ----------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| AUTH-01 | A visitor can register with name, email, password, and one fixed account role.                              | P0       | Implemented in code; target environment validation pending                  |
| AUTH-02 | A user can sign in with email/password or Google.                                                           | P0       | Implemented in code; Google configuration and end-to-end validation pending |
| AUTH-03 | Email registrants can verify their email with an expiring, single-use token.                                | P0       | Implemented in code; resend-verification capability remains pending         |
| AUTH-04 | A user can request and complete password reset with a single-use expiring token.                            | P0       | Implemented in code; deployment validation pending                          |
| AUTH-05 | Sessions can refresh securely; refresh tokens are rotated, stored hashed, and revocable.                    | P0       | Implemented in code; security validation pending                            |
| AUTH-06 | Authentication endpoints limit abuse and avoid disclosing whether an email exists.                          | P0       | Implemented in code; production security review pending                     |
| AUTH-07 | Provider identity and password credential records are kept separate; linking is explicit and authenticated. | P0       | Implemented in code; Google linking validation pending                      |
| AUTH-08 | Resend-verification is available with appropriate throttling and anti-abuse controls.                       | P0       | Pending                                                                     |
| AUTH-09 | Phone OTP is supported as a login or verification channel.                                                  | P2       | Removed from MVP; provider and cost are not selected                        |

### 6.2 Job seeker profile

| ID      | Requirement                                                                                      | Priority | Current status                                                 |
| ------- | ------------------------------------------------------------------------------------------------ | -------- | -------------------------------------------------------------- |
| SEEK-01 | A job seeker can save and resume an incomplete profile, then complete required fields.           | P0       | Implemented in code; end-to-end enforcement validation pending |
| SEEK-02 | Minimum profile includes name, phone, state, city, and experience level including no experience. | P0       | Implemented in code                                            |
| SEEK-03 | Profile supports experience summary, up to 50 skills, and contact visibility settings.           | P0       | Implemented in code; skill seed run still needs confirmation   |
| SEEK-04 | State and city selection use searchable controls; changing state clears the selected city.       | P0       | Implemented in code                                            |
| SEEK-05 | Optional education, profile image, and detailed address can be added.                            | P1       | Pending; secure image storage policy required                  |
| SEEK-06 | A job seeker can browse jobs without registering; authentication is required to apply.           | P0       | API and UI code present; browser validation pending            |
| SEEK-07 | A job seeker can view application history and status, and withdraw where allowed.                | P0       | API and UI code present; withdrawal policy and tests pending   |
| SEEK-08 | A job seeker can save and remove saved jobs.                                                     | P0       | API and contracts present; UI and journey validation pending   |

Contact privacy requirements:

- Seeker email and phone visibility are separate and off by default.
- A seeker's contact details are never shown on a public profile or job listing.
- When permitted, only an employer receiving that seeker's application may access the enabled contact fields.
- Enforce audience rules in API responses and authorization checks.

### 6.3 Employer profile and verification

| ID     | Requirement                                                                                                             | Priority | Current status                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| EMP-01 | An employer can save and complete a profile with business name, employer type, contact person, phone, state, and city.  | P0       | Implemented in code                                                        |
| EMP-02 | Profile completion does not imply verification.                                                                         | P0       | Implemented in code; enforce on future marketplace APIs                    |
| EMP-03 | An employer can upload evidence privately, submit it, replace rejected evidence, and resubmit.                          | P0       | Intake and submission code present; storage and journey validation pending  |
| EMP-04 | Authorized admins can access submitted documents securely and approve, reject, or request more information with reason. | P0       | Review code exists; secure reviewer file delivery remains pending          |
| EMP-05 | Employer can view current verification status and reviewer feedback.                                                    | P0       | Status view implemented in code                                            |
| EMP-06 | Only verified employers may publish jobs; unverified employers may create drafts.                                       | P0       | Job draft/publish API code exists; database and journey validation pending |
| EMP-07 | Business name, employer type, and verification evidence changes trigger a re-review policy.                             | P1       | Sensitive changes are currently restricted; full re-review flow pending    |
| EMP-08 | Employer email/phone are shown publicly only when their individual visibility controls permit it.                       | P0       | Visibility enforced in public API code; privacy validation pending          |

Verification evidence and privacy rules:

- Employers may submit a relevant document; no single document type is mandatory. Admin reviewers assess readability, relevance, identity match where applicable, and expiry.
- If Aadhaar is considered, accept only a masked copy after legal/privacy review. Do not collect or retain a full Aadhaar number. Define safe handling for accidental unmasked uploads before accepting files.
- Use private storage, server-side authorization, limited reviewer access, and short-lived authorized delivery. Do not expose storage keys or permanent public URLs.
- Cloudinary private evidence upload and deletion code exists; account setup, credentials, secure reviewer delivery, and provider security validation remain pending.
- Rejection requires a reason. Employers must replace evidence and resubmit before a new review.

### 6.4 Job creation, publication, and moderation

| ID     | Requirement                                                                                                                                                 | Priority | Current status                                                                      |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| JOB-01 | A completed employer can create and edit drafts.                                                                                                            | P0       | API and UI code implemented; database integration validation pending                |
| JOB-02 | Job listing supports title, description, category, skills, employment type, work mode, experience, salary, openings, location, and expiry where applicable. | P0       | Partial; category/skill selection and remaining lifecycle fields pending            |
| JOB-03 | Only verified employers can publish.                                                                                                                        | P0       | Gate exists in code; end-to-end validation pending                                  |
| JOB-04 | Employer can publish and pause its own eligible job; ownership is checked by API.                                                                           | P0       | API/UI code implemented; integration validation pending                             |
| JOB-05 | Employer can close, mark filled, and manage expired jobs using explicit legal transitions.                                                                  | P0       | Pending                                                                             |
| JOB-06 | Public visitors can search active published jobs by keyword and available filters, sort, and paginate.                                                      | P0       | API/UI code present; pagination drops filters and browser validation is pending     |
| JOB-07 | Job detail shows employer trust status, location, salary if supplied, requirements, and application action.                                                 | P0       | Detail and apply UI code present; completeness and journey validation pending      |
| JOB-08 | Admin can hide/remove problematic jobs and restore hidden jobs with auditable reasons.                                                                      | P0       | Admin moderation review code exists; marketplace integration and validation pending |
| JOB-09 | Draft, paused, rejected, hidden, removed, filled, and expired jobs do not appear as active public vacancies.                                                | P0       | Public API eligibility filters present; lifecycle and integration validation pending |

Verified employers publish without prior job approval. Admin moderation is a separate post-publication control and must support the agreed hide, remove, and restore transitions. Public listing and job detail APIs must enforce eligibility on the server.

### 6.5 Job discovery and location

- Public job discovery is central to the product outcome and is a P0 launch dependency.
- MVP filters: keyword, state/city or supported locality, category, employment type, and salary range when data is available. Results are paginated and default to newest first unless product validation shows another useful default.
- Profile location currently uses state/city reference data. Do not imply that district, PIN-code, coordinates, or radius filters exist until they are modeled, populated, and exposed in search.
- Search results, details, and filters need explicit loading, empty, and recoverable error states.
- Preserve original job content; do not automatically translate job terms, wages, or conditions.
- P1: expand location master data to district/locality/PIN where quality and pilot needs justify it. P2: proximity search and distance sorting.

### 6.6 Applications and employer applicant management

| ID     | Requirement                                                                              | Priority | Current status                                  |
| ------ | ---------------------------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| APP-01 | An authenticated job seeker with a complete profile can apply to an eligible active job. | P0       | API/UI code present; end-to-end validation pending |
| APP-02 | The system prevents duplicate applications per job and seeker.                           | P0       | Unique constraint and API conflict handling present; tests pending |
| APP-03 | Application creation and initial status history are atomic.                              | P0       | Transaction code and test source present; execution pending |
| APP-04 | Job seeker can view application history and current status.                              | P0       | API/UI code present; validation pending |
| APP-05 | Employer can view applicants only for its own jobs.                                      | P0       | Ownership checks and UI code present; privacy tests pending |
| APP-06 | Employer can update application status through allowed server-side transitions.          | P0       | API/UI code present; transition matrix needs product confirmation |
| APP-07 | Status history records actor, old status, new status, and timestamp.                     | P0       | Persistence code present; integration validation pending |
| APP-08 | Job seeker can withdraw only when the current application state allows it.               | P0       | APPLIED-only code present; allowed states need confirmation |
| APP-09 | Application and status events create relevant notifications.                             | P0       | Notification records created; inbox and reliable delivery pending |

Initial status set: `APPLIED`, `REVIEWING`, `SHORTLISTED`, `CONTACTED`, `REJECTED`, `HIRED`, and `WITHDRAWN`. `WITHDRAWN` is terminal: a seeker cannot apply again to the same job after withdrawing. The API must reject another application for that job/seeker pair, and the unique application record remains in place. Do not add a separate `VIEWED` state unless product explicitly enables and explains view tracking. One application record per seeker/job is the rule.

The current implementation permits withdrawal only from `APPLIED` and uses a forward-only employer transition matrix. These are implementation assumptions, not confirmed product policy.

### 6.7 Reports, moderation, and audit

- A signed-in user can submit a report on a supported job or user target, select a reason, and provide optional detail.
- Authorized admins can list and review reports, change status, take an appropriate moderation action, and record a review note.
- Every privileged review or status decision must produce an audit record with actor, target, action, time, and relevant metadata.
- Current admin report review code is not report intake. Do not mark reporting complete until users can submit reports and those reports are visible to admins.
- Define response targets, retention, escalation, and prohibited-content policy before pilot.

### 6.8 Notifications

- Authentication verification and password reset emails are part of the current auth slice.
- P0 marketplace notifications: employer receives new application notice; job seeker receives application status updates; users can view an in-app inbox and mark items read.
- Notification delivery should not make a successful application mutation appear to fail. Record delivery state, retry transient errors safely, and expose operational failures to monitoring.
- Application notification records are currently created in the same transaction as the application mutation; a record-creation failure rolls back the mutation. Delivery independence, inbox/read state, retries, and operational monitoring remain pending.
- Email can supplement in-app delivery for critical events. Exact provider/queue remains subject to deployment and reliability decisions.
- Push, SMS, and WhatsApp are future options, not MVP dependencies.

### 6.9 Account deletion

- Account deletion uses **anonymization with a minimal tombstone**, not immediate hard deletion. This keeps necessary job, application, report, and audit history intact while removing the account holder's direct identifiers.
- Track a request as `REQUESTED`, then `CONFIRMED`, `PROCESSING`, and one of `COMPLETED`, `CANCELLED`, or `FAILED`. On confirmation, set the account to `DELETION_PENDING`, block further sign-in, revoke all sessions, close the employer's published, paused, and pending-review jobs, or withdraw the seeker's applications where the current state allows it. Drafts do not block deletion.
- Replace or clear direct identifiers in the account and role profiles, including name, original email, phone, avatar, address, and seeker profile details. Replace the unique email with a generated, non-routable placeholder so the original address can be used for a new account. Set account status to `DELETED`, record `deletedAt`, and remove password credentials, provider links, and unused authentication tokens.
- Set `anonymizedAt` when identifier removal completes. Keep a minimal deletion-request record; its nullable user relation uses `SET NULL` so a later permitted user-row purge does not cascade-delete the request.
- Keep only the anonymized account/profile rows and related records required to preserve application and status history, closed job records, reports, and auditability. Remove saved jobs, seeker skills/preferences, and uploaded verification files unless a documented retention reason or legal hold requires them. Retained records must not be visible in public search or user workspaces.
- Define a retention schedule by data category and purpose before launch. At the end of each approved period, irreversibly anonymize or purge records that no longer have a documented purpose or legal retention basis. Apply the same lifecycle to backups; a restore must not reintroduce already-purged identifiers.
- Record a deletion request as complete only after required job closures/application withdrawals, access revocation, identifier removal, and relevant audit events have succeeded. Make the operation failure-safe and retryable.
- **Decision recorded:** account deletion follows this anonymization-and-retention approach. **Still pending:** legal/privacy approval of exact retention periods, any required exceptions, and which application statuses are withdrawable.

## 7. UX, accessibility, and localization

- Mobile-first responsive layouts across public, seeker, employer, and admin pages.
- Use the available content width for internal workspaces; use the shared `FormCombobox` instead of `FormSelect` in React Hook Form forms.
- Visible labels, keyboard access, clear focus, semantic markup, touch-sized controls, useful validation, and status meaning that does not rely on color alone.
- Every data-driven screen has loading, empty, failure, success, and retry behavior as relevant.
- Use English, Hindi, and Punjabi translation resources. Review translations with fluent speakers before launch, especially safety, wages, privacy, and verification copy.
- Persist locale for the current browser with the locale cookie behavior already used by the web shell. Account-synchronized preference is not required in the MVP.
- Maintain readability for Gurmukhi and Devanagari text, including content expansion on narrow screens.
- UI enhancements already present include responsive portal layouts, collapsible icon sidebars, shared form controls and comboboxes, save-success toasts without duplicate inline success messaging, improved profile loading feedback, skills pagination/layout updates, and admin queue mobile cards. These improve the current implementation but do not complete the marketplace workflows.
- Run a WCAG 2.2 AA-informed review of core flows before pilot; conformance is not claimed until tested.

## 8. PWA and offline behavior

The PWA is a product target, not a current implementation claim. Before the pilot:

- Add a manifest and validate installation on supported browsers.
- Add a service worker only for appropriate app shell/static assets and safe public read-only content.
- Do not cache sensitive profile, application, or verification data by default.
- Show a clear offline indicator and retry path.
- Never claim that an application or profile change was saved while offline. Do not queue applications for automatic replay in the MVP.

## 9. Architecture and technical constraints

### 9.1 Baseline architecture

- Next.js with TypeScript for public web, authentication, and role workspaces.
- NestJS REST API as the sole owner of business rules, authorization, and database access.
- PostgreSQL as the system of record; Prisma for schema, migrations, and typed data access.
- Shared contracts/validation packages for frontend and API boundaries.
- Modular monolith for the initial release. Do not introduce microservices without a concrete scaling or team-ownership need.
- Private object storage for verification evidence; Cloudinary remains intended but must be configured and security-validated.
- Add asynchronous workers/queues when retries or processing should not block API responses.

### 9.2 API contract

- Current routes are not consistently under `/api/v1`. Treat versioned route names in the architecture and earlier PRD as proposals, not existing endpoints.
- Confirm whether to version the API before external clients depend on it. Document actual and target contracts with Swagger/OpenAPI.
- Validate inputs at API boundaries, return consistent errors, paginate list endpoints, and enforce role plus resource ownership.
- The browser must never connect directly to PostgreSQL or Prisma.

### 9.3 Operational requirements

- Separate development, staging, and production configuration; keep secrets out of source control.
- CI should run formatting/lint, type checks, tests, and builds before deployment.
- Use HTTPS, restricted database networking, protected private storage, application logs, error tracking, health checks, and uptime monitoring.
- Configure automated database backups and verify restoration. Define recovery objectives with the product owner.
- Set measurable page/API performance and availability targets after baseline testing; do not claim a service level before it is measured.

## 10. Current implementation status

Status updated against repository code on 28 November 2026. This is a code review snapshot, not a production-readiness assertion. The recent application and saved-jobs changes have not been built, type-checked, or tested in this environment.

| Capability              | Current implementation                                                                                                                                      | Remaining work / qualification                                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Engineering foundation  | Turborepo, Next.js web, NestJS API, shared contracts, Prisma schema/migrations, env validation, API health endpoint.                                        | Clean environment, CI/deployment pipeline, target DB migration/seed validation, monitoring, backups, production setup.                                                              |
| Authentication          | Email/password register/login, email verification, password recovery, refresh/logout, Google OAuth flow and provider linking code.                          | Google credentials/environment and full deployment validation; resend-verification endpoint; end-to-end/security review.                                                            |
| Role policy             | Registration and current account model support one fixed role.                                                                                              | Keep aligned across future APIs; multi-role architecture option is deferred.                                                                                                        |
| Job seeker profile      | Draft save/completion, state/city comboboxes, paginated searchable skills, contact settings, workspace overview, loading/error UX.                          | Confirm master data seeded; optional education/image; verify completion gates and marketplace journeys.                                                                            |
| Employer profile        | Draft save/completion, contact settings, verification status/feedback, and evidence upload/submission code.                                                | Configure and validate private storage; secure reviewer file access; full re-review flow and end-to-end testing.                                                                   |
| Employer job management | Draft/create/edit, publish and pause API/UI code, verified-employer publication gate.                                                                       | Confirm persistence against target DB; remaining lifecycle; category/skill fields; complete browser journey.                                                                        |
| Public discovery        | Public active-job listing, category, detail and filter API/UI code; employer contact visibility enforced by API.                                            | Preserve filters during pagination; validate details, error/retry states, privacy, accessibility and browser journeys.                                                              |
| Applications            | Seeker apply/history/withdraw and employer applicant/status API/UI code; initial history, ownership checks and notification records.                         | Confirm transition/withdrawal policy; run API and browser tests, including duplicate prevention and contact privacy.                                                               |
| Saved jobs              | Authenticated save, list, saved-state and unsave API and contracts; unavailable saved jobs return no job details.                                          | Build public save controls and seeker saved-jobs UI; resolve profile-completion mismatch; validate API and browser journeys.                                                       |
| Admin                   | Dashboard, employer verification review, job moderation, report review, audit log APIs and UI.                                                              | Report submission intake; secure evidence delivery; production authorization and workflow validation.                                                                              |
| Account deletion        | Schema supports `DELETION_PENDING`/`DELETED`, `deletedAt`/`anonymizedAt`, and a tracked deletion-request lifecycle.                                         | Deletion request API/UI and worker, session and credential cleanup, profile anonymization, retained-history behavior, per-category retention schedule, and backup purge validation. |
| Categories and skills   | Expanded seed files and idempotent seed logic; skills lookup API/UI.                                                                                        | Prior seed command failed while deserializing a `void` advisory-lock result. Query was changed to return text, but successful seed against the intended DB is unconfirmed.          |
| Notifications           | Authentication mail, admin decision records, and application submission/status notification records.                                                      | In-app inbox/read state, delivery independence, reliable retry/delivery operations, and localized notification content.                                                             |
| Localization and UI     | English, Hindi, Punjabi resources for discovery and application interfaces; responsive workspaces and shared form controls.                                | Translate remaining hardcoded verification and notification text; audit language quality, accessibility, and mobile layouts; saved-jobs UI pending.                               |
| PWA                     | No installable/offline completion confirmed.                                                                                                                | Manifest, service worker, safe caching, offline indicator, install validation.                                                                                                      |
| Marketplace loop        | Public discovery, application and employer-review code is present.                                                                                          | P0 launch blocker: complete saved-jobs UI and validate the full loop in a deployment-like environment.                                                                              |
| Launch readiness        | Automated tests exist in repository.                                                                                                                        | Execute critical API/E2E checks against configured services; security/privacy review, deployment, restore test, support/moderation readiness, Punjab pilot.                         |

Prisma models for jobs, applications, saved jobs, notifications, reports, and other entities do not prove that their user-facing journeys are available. Similarly, an admin review screen does not prove that users can submit the item being reviewed.

## 11. Change record from the previous PRD

### 11.1 Newly added

- A direct problem statement centered on the fragmented local hiring loop.
- A measurable product outcome: complete a trustworthy discovery, application, and employer-review loop in a Punjab pilot.
- A reconciliation table showing conflicts between the PRD, architecture proposal, and repository behavior.
- A consistent status vocabulary separating code presence from end-to-end and production validation.
- Explicit recognition that report review is not report intake and that data models are not user journeys.
- Operational launch gates for seed/migration validation, private evidence, monitoring, backup restoration, and a controlled pilot.
- An account-deletion policy that preserves only anonymized history under an approved retention schedule.
- A dependency-based implementation order prioritizing marketplace transactions over advanced capabilities.

### 11.2 Updated

- The product overview now leads with local discovery and hiring friction rather than describing a broad feature set first.
- Location scope now distinguishes current state/city profile selection from future district, PIN, and proximity search.
- The architecture's multi-role account proposal is reconciled with the current single-role implementation. Single role remains the MVP; multi-role is deferred pending explicit approval and migration design.
- Authentication alternatives are narrowed to the implemented MVP decision: email/password and Google. Phone OTP is no longer implied as launch scope.
- Withdrawal is final for a given job: the seeker cannot reapply after withdrawing. The existing one-record-per-job/seeker schema rule remains the MVP behavior.
- Account deletion anonymizes the account and retains only necessary history under a purpose-based schedule; immediate hard deletion is not the product behavior.
- In-platform applications are the primary MVP application method so the product can preserve status and history.
- Verified-employer publication and post-publication job moderation are stated as selected behavior rather than open architecture questions.
- PWA, versioned API, object storage, and notification channels are described as planned or pending wherever implementation is not confirmed.

### 11.3 Removed or superseded from MVP scope

- Phone OTP as a presumed MVP dependency; it is deferred until provider, delivery, cost, and recovery decisions are made.
- District/PIN/coordinate/radius search as a claim about the current profile or search implementation; state/city remains the current profile minimum, and expanded location search is staged.
- Any implication that the architecture's illustrative `/api/v1` endpoints are live routes.
- Any implication that admin report review means users can submit reports.
- Any implication that a schema model, seeded-data file, UI screen, or API slice alone makes a full feature complete.
- Fully offline application submission; applications remain online-only in the MVP.

No implemented feature was deleted from the repository by this PRD. “Removed” above means removed from the MVP requirement or corrected as an unsupported completion claim.

### 11.4 Completed in code as of this review

- Authentication and account recovery foundations for email/password, email verification, Google OAuth, sessions, and provider linking.
- Job seeker and employer profile draft/completion flows and contact visibility controls.
- State/city searchable selectors and skill search/pagination UI.
- Employer job draft management and publish/pause UI/API code with verification gating.
- Admin dashboard and review surfaces for verification, jobs, reports, and audit records.
- Responsive workspaces, collapsible icon sidebars, shared form controls, success toasts, and translated interfaces.
- Employer evidence upload/submission code and private-storage integration; public discovery and application/review API and UI code.
- Saved-jobs API and contracts only; the user-facing saved-jobs journey is not yet implemented.

Completion is limited to the code slices listed. Target database validation, external provider configuration, and end-to-end journeys remain pending where stated in Section 10.

## 12. Pending decisions and risks

| Decision / risk                          | Why it matters                                                                                                | Required resolution                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Verification evidence policy and privacy | Sensitive business evidence may include personal identifiers.                                                 | Approve accepted evidence, masked Aadhaar policy, accidental unmasked-upload handling, retention, reviewer access, and deletion. |
| Private file delivery                    | Permanent public document URLs could expose evidence.                                                         | Validate Cloudinary private storage and authorized/temporary reviewer access before accepting uploads.                           |
| Job moderation policy                    | Abuse controls must be predictable for employers and seekers.                                                 | Define prohibited content, response targets, hide/remove/restore transitions, and appeal handling.                               |
| Application withdrawal rules             | Withdrawal must not erase application history or allow a second application to the same job.                  | Reapplication after withdrawal is not allowed. Confirm which pre-withdrawal statuses may be withdrawn.                           |
| Application status transitions           | The implementation currently assumes a forward-only employer transition matrix.                             | Confirm allowed transitions and terminal states before pilot.                                                                    |
| Saved-job profile requirement             | The saved-jobs API allows incomplete profiles, unlike the role-action policy in Section 4.4.                   | Confirm whether saving is an exception or enforce profile completion consistently.                                                |
| Account deletion retention periods       | The deletion behavior is defined, but exact retention periods depend on legal duties and documented purposes. | Approve a per-data-category schedule, legal exceptions/holds, and backup expiry with privacy counsel before launch.              |
| API versioning                           | Existing routes do not use the proposed prefix.                                                               | Decide versioning before external clients or long-lived integrations are published.                                              |
| Location source                          | Search quality depends on complete canonical data.                                                            | Confirm state/city coverage now; assess district/PIN source and update cadence before expanding.                                 |
| Google OAuth operations                  | Code exists, but deployment credentials and callback configuration are environment-specific.                  | Configure and validate register, sign-in, linking, role preservation, failure recovery, and account collision cases.             |
| Email delivery and async retries         | Application and auth events must not be silently lost.                                                        | Confirm provider, queue/retry strategy, delivery monitoring, and operational owner.                                              |
| Pilot supply                             | A marketplace with no local listings has little value to job seekers.                                         | Recruit initial employers and jobs in a limited Punjab geography before broad seeker acquisition.                                |
| Master data                              | Skills UI depends on populated rows.                                                                          | Apply migrations and successfully run the seed against the intended database; capture the successful result.                     |

## 13. Implementation roadmap

The sequence below prioritizes the actual product problem. Complete each stage as a working vertical slice; do not count isolated screens or schema changes as completion.

### Stage 0: Confirm baseline and decisions

- Confirm migration status and schema alignment against the intended development database.
- Run category/skill master-data seed successfully and record the environment used.
- Resolve evidence storage/privacy, withdrawable application statuses, exact account-data retention periods with privacy counsel, and moderation policy.
- Confirm current API contracts and decide versioning before publishing external clients.

### Stage 1: Finish employer verification intake

- Evidence upload/submission and private-storage integration are present in code; configure and validate the provider.
- Complete secure authorized reviewer file access and validate replacement/resubmission.
- Validate the admin queue, approval/rejection feedback, audit records, and publication gating through browser and API journeys.

### Stage 2: Build public job discovery

- Complete job categories/skills and remaining job lifecycle operations.
- Public active-job listing, detail and filter API/UI code is present; preserve filters when paging and complete error/retry states.
- Validate eligibility filtering, visitor browsing and employer-owned job management.

### Stage 3: Build applications and saved jobs

- Application, history, withdrawal and employer review code is present; confirm the transition and withdrawal rules.
- Saved-job save/list/state/unsave API and contracts are present; implement the public and seeker UI and resolve the profile-completion policy mismatch.
- Run focused API tests and add/run end-to-end tests for the core hiring loop and contact privacy.

### Stage 4: Complete reporting and user notifications

- Implement user report submission and connect it to admin review.
- Application notification records are generated; implement notification inbox/read state and delivery independence.
- Add safe retries and delivery observability for critical email/in-app work.

### Stage 5: Prepare and run the Punjab pilot

- Validate authentication, authorization, privacy, moderation, and deletion behavior.
- Complete migration/seed checks, CI, security review, backup restoration, monitoring, and deployment rollback procedures.
- Complete accessibility, language quality, and mobile usability reviews.
- Recruit pilot employers/listings and a small seeker cohort, measure outcomes, and resolve issues before wider promotion.
- Complete PWA installability/offline behavior before claiming the PWA launch requirement is met.

## 14. Success measures

These are proposed metrics. Establish baselines during the pilot and set numerical targets with the product owner before wider launch.

| Outcome        | Measure                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Local supply   | Active jobs and verified employers in the pilot geography                                                             |
| Seeker value   | Search-to-job-detail rate; job-detail-to-application rate                                                             |
| Employer value | Applications per active job; time from publication to first eligible application                                      |
| Hiring loop    | Share of applications receiving an employer status update; time to first review                                       |
| Trust          | Reports per 100 active jobs; median moderation resolution time; verification turnaround                               |
| Reliability    | Availability, API error rate, and completion rate for registration, profile completion, posting, search, and applying |
| Inclusion      | Completion and error rates by locale and device class, where measurement is privacy-safe                              |

Collect only data needed for product decisions. Avoid exposing sensitive applicant or identity information in analytics.

## 15. MVP acceptance criteria

The controlled MVP pilot may begin only when all P0 journeys below work end to end in a deployment-like environment:

- [ ] A job seeker can register, verify email, complete a minimum profile, browse/search jobs, save a job, apply once, view status, and withdraw when allowed.
- [ ] An employer can register, complete a profile, submit private evidence, receive an admin decision, and resubmit after rejection.
- [ ] Only verified employers can publish; authorized employers can manage their own listings and review applicants.
- [ ] Job seekers can search public active jobs and see accurate employer, location, salary, and requirements information.
- [ ] Application transitions and ownership are enforced in the API, with complete history and relevant notifications.
- [ ] Reports can be submitted by users and reviewed by admins; privileged actions are audited.
- [ ] Contact visibility defaults to private and follows the audience rules in Section 6.2.
- [ ] Account deletion revokes access, anonymizes direct identifiers, preserves only approved history, and follows the approved retention and backup-expiry schedule.
- [ ] English, Hindi, and Punjabi are usable on supported phone and desktop layouts, with translation and accessibility review completed.
- [ ] Database migrations and master-data seeding succeed on a clean target-like database.
- [ ] Critical API and browser tests pass; no known critical/high security defects remain.
- [ ] Production secrets, monitoring, backups, and restore/rollback procedures are verified.
- [ ] Support and moderation owners are ready, and a limited Punjab pilot cohort is identified.

The PWA install/offline requirement must be completed before describing the launch as a PWA release. It need not delay an explicitly approved web-only pilot if the product owner revises that launch commitment.

## 16. Future enhancements

Consider these after the core marketplace loop is stable and pilot data supports them:

- Multi-role accounts with role switching. Requires account, onboarding, authorization, and migration design; not just a UI toggle.
- District/locality/PIN normalization, radius search, distance sort, saved searches, and job alerts.
- PWA push notifications and safe offline access to public read-only content.
- Optional resumes, profile images, and richer seeker profiles with secure storage.
- Multiple employer staff accounts and hiring analytics.
- Promoted listings or subscriptions after validating trust, supply, and willingness to pay. Core discovery should remain useful and fair.
- Search ranking, recommendations, typo tolerance, and fraud detection only when evidence justifies the complexity.
- SMS or WhatsApp notifications only after consent, provider, cost, and abuse controls are defined.

## 17. Source and status notes

- The high-level architecture is an initial conceptual proposal dated 27 November 2026 and marked for review and requirements validation. Its technology and workflow tables are inputs to this PRD, not proof of current implementation.
- This revised PRD is the product baseline. The previous PRD remains available in Git history as a historical reference.
- Repository implementation status was updated on 28 November 2026. Code presence does not establish successful deployment, database execution, or end-to-end product readiness.
- Do not treat illustrative routes, proposed metrics, future enhancements, or architecture diagrams as approved production behavior unless this PRD or a later decision record confirms them.
