# `employer_documents` (`EmployerDocument`)

## Use case

Stores metadata for evidence submitted during employer verification and the
result of its review. The file itself is represented by `storageKey`; storage
access and protection are handled outside this table.

## Scalar fields

| Field            | Prisma type                                | Purpose                                      |
| ---------------- | ------------------------------------------ | -------------------------------------------- |
| `id`             | `String` (UUID, generated)                 | Primary document-record identifier.          |
| `employerId`     | `String` (UUID)                            | Employer profile submitting the document.    |
| `documentType`   | `EmployerDocumentType`                     | Classification of submitted evidence.        |
| `storageKey`     | `String`                                   | Key/path used to locate the stored file.     |
| `storageAssetId` | `String?`                                  | Cloudinary asset ID for authenticated uploads; null for legacy evidence requiring review. |
| `originalName`   | `String?`                                  | User-provided filename for display.          |
| `mimeType`       | `String?` (max 120 chars)                  | File media type.                             |
| `fileSizeBytes`  | `BigInt?`                                  | Optional size of the stored file in bytes.   |
| `documentNumber` | `String?`                                  | Optional identifier printed on the document. |
| `issuedAt`       | `DateTime?`                                | Optional document issue date.                |
| `expiresAt`      | `DateTime?`                                | Optional document expiration date.           |
| `reviewStatus`   | `DocumentReviewStatus` (default `PENDING`) | Current review state for this document.      |
| `reviewedById`   | `String?` (UUID)                           | User who reviewed the document.              |
| `reviewedAt`     | `DateTime?`                                | Time the document was reviewed.              |
| `reviewNote`     | `String?`                                  | Reviewer feedback about this document.       |
| `createdAt`      | `DateTime` (default now)                   | Record creation/submission time.             |
| `updatedAt`      | `DateTime` (auto-updated)                  | Last metadata or review update.              |

## Relations

- Belongs to one `EmployerProfile`; deleting the employer cascades to its
  document records.
- Optional reviewer relation to `User` uses `SetNull` on delete.

## Constraints and indexes

- Indexes support employer document queues by review status, filtering by
  document type, and expiry checks.
- Do not expose private document storage keys to unauthorized clients.

See the [database table index](./README.md) and
[Prisma schema](../../../packages/db/prisma/schema.prisma).
