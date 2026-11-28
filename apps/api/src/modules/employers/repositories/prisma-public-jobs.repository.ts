import { Injectable } from '@nestjs/common';
import type {
  PublicJob,
  PublicJobListResponse,
  PublicJobsQuery,
} from '@repo/contracts';
import type { Prisma } from '@repo/db/generated';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { PublicJobsRepository } from './public-jobs.repository.js';
import { publicJobEligibility } from './public-job-eligibility.js';

const publicJobSelect = {
  id: true,
  title: true,
  description: true,
  responsibilities: true,
  employmentType: true,
  workMode: true,
  experienceLevel: true,
  salaryMin: true,
  salaryMax: true,
  salaryPeriod: true,
  isSalaryNegotiable: true,
  openings: true,
  addressLine: true,
  localityName: true,
  cityName: true,
  districtName: true,
  stateName: true,
  postalCode: true,
  workingHours: true,
  shiftDetails: true,
  isUrgent: true,
  publishedAt: true,
  expiresAt: true,
  category: { select: { id: true, name: true } },
  skills: {
    orderBy: { skill: { name: 'asc' } },
    select: { skill: { select: { id: true, name: true } } },
  },
  employer: {
    select: {
      id: true,
      businessName: true,
      employerType: true,
      showEmail: true,
      showPhone: true,
      verificationStatus: true,
      businessPhone: true,
      user: { select: { email: true } },
    },
  },
} satisfies Prisma.JobSelect;

type PublicJobRecord = Prisma.JobGetPayload<{ select: typeof publicJobSelect }>;

function toPublicJob(job: PublicJobRecord): PublicJob {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    responsibilities: job.responsibilities,
    employmentType: job.employmentType,
    workMode: job.workMode,
    experienceLevel: job.experienceLevel,
    salaryMin: job.salaryMin?.toString() ?? null,
    salaryMax: job.salaryMax?.toString() ?? null,
    salaryPeriod: job.salaryPeriod,
    isSalaryNegotiable: job.isSalaryNegotiable,
    openings: job.openings,
    addressLine: job.addressLine,
    localityName: job.localityName,
    cityName: job.cityName,
    districtName: job.districtName,
    stateName: job.stateName,
    postalCode: job.postalCode,
    workingHours: job.workingHours,
    shiftDetails: job.shiftDetails,
    isUrgent: job.isUrgent,
    publishedAt: job.publishedAt?.toISOString() ?? null,
    expiresAt: job.expiresAt?.toISOString() ?? null,
    category: job.category,
    skills: job.skills.map(({ skill }) => skill),
    employer: {
      id: job.employer.id,
      businessName: job.employer.businessName,
      employerType: job.employer.employerType,
      verificationStatus: 'VERIFIED',
      email: job.employer.showEmail ? job.employer.user.email : null,
      phone: job.employer.showPhone ? job.employer.businessPhone : null,
    },
  };
}

@Injectable()
export class PrismaPublicJobsRepository implements PublicJobsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PublicJobsQuery): Promise<PublicJobListResponse> {
    const now = new Date();
    const eligibility = publicJobEligibility(now);
    const and: Prisma.JobWhereInput[] = [
      { status: eligibility.status, employer: eligibility.employer },
      { OR: eligibility.OR },
    ];

    if (query.keyword) {
      const keyword = query.keyword;
      and.push({
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          { responsibilities: { contains: keyword, mode: 'insensitive' } },
        ],
      });
    }
    if (query.categoryId) and.push({ categoryId: query.categoryId });
    if (query.stateName) {
      and.push({ stateName: { contains: query.stateName, mode: 'insensitive' } });
    }
    if (query.cityName) {
      and.push({ cityName: { contains: query.cityName, mode: 'insensitive' } });
    }
    if (query.employmentType) and.push({ employmentType: query.employmentType });
    if (query.salaryMin !== undefined) {
      and.push({
        OR: [
          { salaryMax: { gte: query.salaryMin } },
          { isSalaryNegotiable: true },
        ],
      });
    }
    if (query.salaryMax !== undefined) {
      and.push({
        OR: [
          { salaryMin: { lte: query.salaryMax } },
          { isSalaryNegotiable: true },
        ],
      });
    }

    const where: Prisma.JobWhereInput = { AND: and };
    const orderBy: Prisma.JobOrderByWithRelationInput[] =
      query.sort === 'OLDEST'
        ? [{ publishedAt: 'asc' }, { id: 'asc' }]
        : query.sort === 'SALARY_LOW'
          ? [{ isSalaryNegotiable: 'asc' }, { salaryMin: 'asc' }, { publishedAt: 'desc' }]
          : query.sort === 'SALARY_HIGH'
            ? [{ isSalaryNegotiable: 'asc' }, { salaryMax: 'desc' }, { publishedAt: 'desc' }]
            : [{ publishedAt: 'desc' }, { id: 'desc' }];

    const [records, total] = await Promise.all([
      this.prisma.client.job.findMany({
        where,
        select: publicJobSelect,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.client.job.count({ where }),
    ]);

    return {
      items: records.map(toPublicJob),
      pageInfo: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        hasNextPage: query.page * query.pageSize < total,
      },
    };
  }

  async findById(id: string): Promise<PublicJob> {
    const now = new Date();
    const record = await this.prisma.client.job.findFirst({
      where: {
        id,
        ...publicJobEligibility(now),
      },
      select: publicJobSelect,
    });
    if (!record) throw new Error('PUBLIC_JOB_NOT_FOUND');
    return toPublicJob(record);
  }

  async categories(): Promise<{
    items: Array<{ id: string; name: string; slug: string }>;
  }> {
    const items = await this.prisma.client.jobCategory.findMany({
      where: { isActive: true, parentId: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true },
    });
    return { items };
  }
}
