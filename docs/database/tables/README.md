# Database table reference

These pages describe the Prisma models and their mapped PostgreSQL tables,
including intended use, scalar fields, relations, and schema constraints.
The Prisma schema is the source of truth; review it before changing a table.

| Prisma model               | Database table                 | Documentation                                               |
| -------------------------- | ------------------------------ | ----------------------------------------------------------- |
| `User`                     | `users`                        | [User](./user.md)                                           |
| `AccountDeletionRequest`   | `account_deletion_requests`    | [AccountDeletionRequest](./account-deletion-request.md)     |
| `UserAuthProvider`         | `user_auth_providers`          | [UserAuthProvider](./user-auth-provider.md)                 |
| `AuthSession`              | `auth_sessions`                | [AuthSession](./auth-session.md)                            |
| `PasswordCredential`       | `password_credentials`         | [PasswordCredential](./password-credential.md)              |
| `EmailVerificationToken`   | `email_verification_tokens`    | [EmailVerificationToken](./email-verification-token.md)     |
| `PasswordResetToken`       | `password_reset_tokens`        | [PasswordResetToken](./password-reset-token.md)             |
| `AuthRefreshToken`         | `auth_refresh_tokens`          | [AuthRefreshToken](./auth-refresh-token.md)                 |
| `OtpRequest`               | `otp_requests`                 | [OtpRequest](./otp-request.md)                              |
| `SeekerProfile`            | `seeker_profiles`              | [SeekerProfile](./seeker-profile.md)                        |
| `EmployerProfile`          | `employer_profiles`            | [EmployerProfile](./employer-profile.md)                    |
| `EmployerDocument`         | `employer_documents`           | [EmployerDocument](./employer-document.md)                  |
| `Location`                 | `locations`                    | [Location](./location.md)                                   |
| `JobCategory`              | `job_categories`               | [JobCategory](./job-category.md)                            |
| `Skill`                    | `skills`                       | [Skill](./skill.md)                                         |
| `SeekerSkill`              | `seeker_skills`                | [SeekerSkill](./seeker-skill.md)                            |
| `JobSkill`                 | `job_skills`                   | [JobSkill](./job-skill.md)                                  |
| `Job`                      | `jobs`                         | [Job](./job.md)                                             |
| `JobApplication`           | `job_applications`             | [JobApplication](./job-application.md)                      |
| `ApplicationStatusHistory` | `application_status_histories` | [ApplicationStatusHistory](./application-status-history.md) |
| `SavedJob`                 | `saved_jobs`                   | [SavedJob](./saved-job.md)                                  |
| `Notification`             | `notifications`                | [Notification](./notification.md)                           |
| `Report`                   | `reports`                      | [Report](./report.md)                                       |
| `AuditLog`                 | `audit_logs`                   | [AuditLog](./audit-log.md)                                  |

Fields marked with `?` are nullable. Prisma relation fields describe links to
other models and are not additional scalar columns. Defaults, enum values,
relations, and indexes are defined in
[schema.prisma](../../../packages/db/prisma/schema.prisma).
