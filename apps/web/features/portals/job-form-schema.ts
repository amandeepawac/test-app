import { z } from 'zod';
import { employerJobCreateSchema, type EmployerJobResponse } from '@repo/contracts';

const fields = employerJobCreateSchema.shape;
const money = z.string().refine(
  (value) => !value || (/^\d{1,10}(\.\d{1,2})?$/.test(value) && Number(value) <= 9999999999.99),
  'invalidMoney',
);
const optionalText = (max: number) => z.string().trim().max(max, 'textTooLong');

export const jobFormSchema = z.object({
  title: z.string().trim().min(1, 'requiredField').max(200, 'textTooLong'),
  description: z.string().trim().min(1, 'requiredField').max(10000, 'textTooLong'),
  employmentType: fields.employmentType,
  workMode: fields.workMode.unwrap(),
  experienceLevel: fields.experienceLevel.unwrap(),
  salaryMin: money,
  salaryMax: money,
  salaryPeriod: fields.salaryPeriod.unwrap(),
  isSalaryNegotiable: z.boolean(),
  openings: z.string().refine((value) => /^[1-9]\d*$/.test(value) && Number(value) <= 100000, 'invalidOpenings'),
  stateName: optionalText(100),
  cityName: optionalText(100),
  districtName: optionalText(100),
  localityName: optionalText(100),
  addressLine: optionalText(500),
  postalCode: optionalText(12),
  responsibilities: optionalText(10000),
  workingHours: optionalText(500),
  shiftDetails: optionalText(500),
  isUrgent: z.boolean(),
  expiresAt: z.string().refine((value) => !value || Number.isFinite(new Date(value).getTime()), 'invalidDate'),
}).superRefine((values, context) => {
  if (values.salaryMin && values.salaryMax && Number(values.salaryMin) > Number(values.salaryMax)) {
    context.addIssue({ code: 'custom', path: ['salaryMax'], message: 'salaryRange' });
  }
});

export type JobFormValues = z.infer<typeof jobFormSchema>;

function localDateTime(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function jobFormDefaults(job?: EmployerJobResponse): JobFormValues {
  return {
    title: job?.title ?? '', description: job?.description ?? '',
    employmentType: job?.employmentType ?? 'FULL_TIME', workMode: job?.workMode ?? 'ON_SITE',
    experienceLevel: job?.experienceLevel ?? 'NO_EXPERIENCE',
    salaryMin: job?.salaryMin ?? '', salaryMax: job?.salaryMax ?? '',
    salaryPeriod: job?.salaryPeriod ?? 'MONTH', isSalaryNegotiable: job?.isSalaryNegotiable ?? false,
    openings: String(job?.openings ?? 1), stateName: job?.stateName ?? '', cityName: job?.cityName ?? '',
    districtName: job?.districtName ?? '', localityName: job?.localityName ?? '',
    addressLine: job?.addressLine ?? '', postalCode: job?.postalCode ?? '',
    responsibilities: job?.responsibilities ?? '', workingHours: job?.workingHours ?? '',
    shiftDetails: job?.shiftDetails ?? '', isUrgent: job?.isUrgent ?? false,
    expiresAt: localDateTime(job?.expiresAt),
  };
}

export function toJobInput(values: JobFormValues) {
  return {
    ...values,
    salaryMin: values.salaryMin ? Number(values.salaryMin) : null,
    salaryMax: values.salaryMax ? Number(values.salaryMax) : null,
    openings: Number(values.openings),
    stateName: values.stateName || null,
    cityName: values.cityName || null,
    districtName: values.districtName || null,
    localityName: values.localityName || null,
    addressLine: values.addressLine || null,
    postalCode: values.postalCode || null,
    responsibilities: values.responsibilities || null,
    workingHours: values.workingHours || null,
    shiftDetails: values.shiftDetails || null,
    expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
  };
}

export function toJobUpdate(values: JobFormValues, dirty: Partial<Record<keyof JobFormValues, boolean>>) {
  return Object.fromEntries(
    Object.entries(toJobInput(values)).filter(([name]) => dirty[name as keyof JobFormValues]),
  );
}
