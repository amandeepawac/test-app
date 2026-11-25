import { expect, test } from '@playwright/test';
import {
  forgotPasswordFormSchema,
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

test('registration validates name and matching passwords even when email is invalid', () => {
  const result = registerFormSchema.safeParse({
    name: '  ',
    email: 'invalid',
    password: 'one',
    confirmPassword: 'two',
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
      password: 'secret',
      confirmPassword: 'secret',
    }).success,
  ).toBe(true);
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
