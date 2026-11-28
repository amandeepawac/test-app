import { expect, test } from '@playwright/test';
import {
  jobFormDefaults,
  jobFormSchema,
  toJobInput,
  toJobUpdate,
} from '../features/portals/job-form-schema';

test('job form validates required information and salary ranges', () => {
  const values = { ...jobFormDefaults(), title: 'Cook', description: 'Prepare meals' };
  expect(jobFormSchema.safeParse(values).success).toBe(true);
  expect(jobFormSchema.safeParse({ ...values, title: ' ' }).success).toBe(false);
  expect(jobFormSchema.safeParse({ ...values, salaryMin: '100', salaryMax: '99' }).success).toBe(
    false,
  );
  expect(jobFormSchema.safeParse({ ...values, salaryMin: '1.999' }).success).toBe(false);
  expect(jobFormSchema.safeParse({ ...values, openings: '0' }).success).toBe(false);
});

test('job updates send only changed fields and preserve untouched expiry and skills', () => {
  const values = {
    ...jobFormDefaults(),
    title: 'Updated',
    description: 'Prepare meals',
    salaryMin: '',
    expiresAt: '2027-01-01T10:00',
  };
  expect(toJobUpdate(values, { title: true, salaryMin: true })).toEqual({
    title: 'Updated',
    salaryMin: null,
  });
  expect(toJobInput(values)).toMatchObject({ title: 'Updated', salaryMin: null, openings: 1 });
  expect(toJobInput(values)).not.toHaveProperty('skillIds');
  expect(toJobInput(values)).not.toHaveProperty('categoryId');
});
