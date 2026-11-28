import { expect, test } from '@playwright/test';
import { accessEmployerDocumentAction } from '@/features/admin/admin-actions';
import { documentAccessResponseSchema } from '@/features/admin/admin-api';

const validId = '01900000-0000-7000-8000-000000000001';

test('document access rejects malformed employer and document IDs before making a request', async () => {
  for (const [employerId, documentId] of [
    ['invalid', validId],
    [validId, 'invalid'],
  ] as const) {
    const result = await accessEmployerDocumentAction(employerId, documentId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.status).toBe(400);
  }
});

test('document access accepts only HTTPS Cloudinary download URLs', () => {
  const expiresAt = '2026-01-01T00:00:00.000Z';
  expect(
    documentAccessResponseSchema.safeParse({
      url: 'https://api.cloudinary.com/v1_1/example/asset/download?signature=synthetic',
      expiresAt,
    }).success,
  ).toBe(true);

  for (const url of [
    'https://example.com/v1_1/example/asset/download',
    'http://api.cloudinary.com/v1_1/example/asset/download',
    'https://api.cloudinary.com/v1_1/example/other',
    'not a URL',
  ]) {
    expect(documentAccessResponseSchema.safeParse({ url, expiresAt }).success).toBe(false);
  }
});
