import { expect, test } from '@playwright/test';
import { employerFormSchema, omitEmptyFields, seekerFormSchema } from '@/features/portals/profile-form-schema';
import { employerProfileUpdateSchema, jobSeekerProfileUpdateSchema } from '@repo/contracts';

test('empty onboarding drafts omit mandatory fields rather than submitting invalid strings', () => {
  const employer = employerFormSchema.parse({
    businessName: '', employerType: '', contactPersonName: '', businessPhone: '',
    stateName: '', cityName: '', businessDescription: '', addressLine: '', websiteUrl: '',
  });
  expect(employerProfileUpdateSchema.safeParse(omitEmptyFields(employer)).success).toBe(true);
  const seeker = seekerFormSchema.parse({
    fullName: '', phone: '', stateName: '', cityName: '', experienceLevel: '',
    experienceSummary: '', skillIds: [],
  });
  expect(jobSeekerProfileUpdateSchema.safeParse(omitEmptyFields(seeker)).success).toBe(true);
});

test('profile forms reject invalid phone numbers and unsafe websites', () => {
  const employer = {
    businessName: 'Example', employerType: 'SHOP', contactPersonName: 'Sam',
    businessPhone: '+91 9876543210', stateName: 'Punjab', cityName: 'Ludhiana',
    businessDescription: '', addressLine: '', websiteUrl: '',
  };
  expect(employerFormSchema.safeParse(employer).success).toBe(true);
  expect(employerFormSchema.safeParse({ ...employer, businessPhone: 'not-a-phone' }).success).toBe(false);
  expect(employerFormSchema.safeParse({ ...employer, websiteUrl: 'javascript:alert(1)' }).success).toBe(false);
});
