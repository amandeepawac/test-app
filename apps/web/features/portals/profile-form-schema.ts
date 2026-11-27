import { z } from 'zod';
import { employerProfileUpdateSchema, jobSeekerProfileUpdateSchema } from '@repo/contracts';

const empty = z.literal('');
const employer = employerProfileUpdateSchema.shape;
// Drafts allow empty required fields; completion is validated by the API.
export const employerFormSchema = z.object({
  businessName: employer.businessName.unwrap().or(empty),
  employerType: employer.employerType.unwrap().or(empty),
  contactPersonName: employer.contactPersonName.unwrap().or(empty),
  businessPhone: employer.businessPhone.unwrap().or(empty),
  stateName: employer.stateName.unwrap().or(empty),
  cityName: employer.cityName.unwrap().or(empty),
  businessDescription: z.string().trim().max(2000),
  addressLine: z.string().trim().max(500),
  websiteUrl: employer.websiteUrl.unwrap().unwrap().or(empty),
});
const seeker = jobSeekerProfileUpdateSchema.shape;
export const seekerFormSchema = z.object({
  fullName: seeker.fullName.unwrap().or(empty),
  phone: seeker.phone.unwrap().or(empty),
  stateName: seeker.stateName.unwrap().or(empty),
  cityName: seeker.cityName.unwrap().or(empty),
  experienceLevel: seeker.experienceLevel.unwrap().or(empty),
  experienceSummary: z.string().trim().max(2000),
  skillIds: z.array(z.uuid()).max(50),
});
export type EmployerFormValues = z.infer<typeof employerFormSchema>;
export type SeekerFormValues = z.infer<typeof seekerFormSchema>;

export function needsCityForStateChange(
  values: { stateName: string; cityName: string },
  saved: { stateName: string | null; cityName: string | null } | null,
) {
  return !!saved?.cityName && saved.stateName !== values.stateName && !values.cityName;
}

export function omitEmptyFields<T extends Record<string, unknown>>(values: T) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
}
