import { expect, test } from '@playwright/test';
import {
  forgotPasswordFormSchema,
  googleAuthRequestSchema,
  loginFormSchema,
  registerFormSchema,
  resetPasswordFormSchema,
} from '@repo/contracts';

test('login and recovery schemas validate their own fields', () => {
  expect(loginFormSchema.safeParse({ email: 'user@example.com', password: 'secret' }).success).toBe(
    true,
  );
  expect(loginFormSchema.safeParse({ email: 'not-an-email', password: '' }).success).toBe(false);
  expect(forgotPasswordFormSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
  expect(forgotPasswordFormSchema.safeParse({ email: '' }).success).toBe(false);
});

test('Google exchange requires PKCE, a nonce and an explicit public signup role', () => {
  const payload = { code: 'code', codeVerifier: 'a'.repeat(43), nonce: 'b'.repeat(43) };
  expect(googleAuthRequestSchema.safeParse({ ...payload, mode: 'login' }).success).toBe(true);
  expect(googleAuthRequestSchema.safeParse({ ...payload, mode: 'signup', role: 'EMPLOYER' }).success).toBe(true);
  expect(googleAuthRequestSchema.safeParse({ ...payload, mode: 'signup' }).success).toBe(false);
  expect(googleAuthRequestSchema.safeParse({ ...payload, mode: 'signup', role: 'ADMIN' }).success).toBe(false);
  expect(googleAuthRequestSchema.safeParse({ ...payload, mode: 'login', nonce: 'bad' }).success).toBe(false);
  expect(googleAuthRequestSchema.safeParse({ ...payload, mode: 'link', codeVerifier: '' }).success).toBe(false);
});

test('registration validates name and matching passwords even when email is invalid', () => {
  const result = registerFormSchema.safeParse({
    name: '  ',
    email: 'invalid',
    password: 'one',
    confirmPassword: 'two',
    role: 'JOB_SEEKER',
  });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues.map(({ message }) => message)).toEqual(
      expect.arrayContaining(['nameRequired', 'emailInvalid', 'passwordsMismatch']),
    );
  }
  expect(
    registerFormSchema.safeParse({
      name: 'Example User',
      email: 'user@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
      role: 'JOB_SEEKER',
    }).success,
  ).toBe(true);
});

test('registration accepts one public role and rejects missing or admin roles', () => {
  const input = {
    name: 'Example User',
    email: 'user@example.com',
    password: 'secret123',
    confirmPassword: 'secret123',
  };
  for (const role of ['JOB_SEEKER', 'EMPLOYER']) {
    const parsed = registerFormSchema.parse({ ...input, role });
    expect(parsed.role).toBe(role);
  }
  for (const role of [undefined, 'ADMIN', '']) {
    const result = registerFormSchema.safeParse({ ...input, role });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['role'], message: 'roleRequired' }),
        ]),
      );
    }
  }
});

test('reset password requires both passwords and checks they match', () => {
  expect(resetPasswordFormSchema.safeParse({ password: '', confirmPassword: '' }).success).toBe(
    false,
  );
  const result = resetPasswordFormSchema.safeParse({ password: 'one', confirmPassword: 'two' });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0]?.path).toEqual(['confirmPassword']);
    expect(result.error.issues[0]?.message).toBe('passwordsMismatch');
  }
  expect(
    resetPasswordFormSchema.safeParse({ password: 'secret', confirmPassword: 'secret' }).success,
  ).toBe(true);
});
