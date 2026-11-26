import { Injectable } from '@nestjs/common';
import type {
  JobSeekerProfileResponse,
  JobSeekerProfileUpdate,
  JobSeekerSkillsQuery,
  JobSeekerSkillsResponse,
} from '@repo/contracts';
import { Prisma } from '@repo/db/generated';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import {
  JobSeekerInvalidSkillsError,
  JobSeekerPhoneConflictError,
  JobSeekerProfileIncompleteError,
  JobSeekerProfileNotFoundError,
} from '@/modules/job-seeker/job-seeker-errors.js';
import { JobSeekerProfileRepository } from './job-seeker-profile.repository.js';

const profileSelect = {
  id: true,
  fullName: true,
  stateName: true,
  cityName: true,
  experienceLevel: true,
  experienceSummary: true,
  showEmail: true,
  showPhone: true,
  completedAt: true,
  user: { select: { email: true, phone: true } },
  skills: { select: { skill: { select: { id: true, name: true } } } },
} satisfies Prisma.SeekerProfileSelect;

type ProfileRecord = Prisma.SeekerProfileGetPayload<{ select: typeof profileSelect }>;

function toResponse(profile: ProfileRecord): JobSeekerProfileResponse {
  return {
    id: profile.id,
    fullName: profile.fullName,
    email: profile.user.email,
    phone: profile.user.phone,
    stateName: profile.stateName,
    cityName: profile.cityName,
    experienceLevel: profile.experienceLevel,
    experienceSummary: profile.experienceSummary,
    skills: profile.skills.map(({ skill }) => skill),
    showEmail: profile.showEmail,
    showPhone: profile.showPhone,
    completedAt: profile.completedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class PrismaJobSeekerProfileRepository implements JobSeekerProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listSkills(query: JobSeekerSkillsQuery): Promise<JobSeekerSkillsResponse> {
    const where: Prisma.SkillWhereInput = {
      isActive: true,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.client.skill.findMany({
        where,
        select: { id: true, name: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.client.skill.count({ where }),
    ]);
    return {
      items,
      pageInfo: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        hasNextPage: query.page * query.pageSize < total,
      },
    };
  }

  async findByUserId(userId: string): Promise<JobSeekerProfileResponse | null> {
    const profile = await this.prisma.client.seekerProfile.findUnique({
      where: { userId },
      select: profileSelect,
    });
    return profile ? toResponse(profile) : null;
  }

  async save(userId: string, input: JobSeekerProfileUpdate): Promise<JobSeekerProfileResponse> {
    return this.prisma.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE`;
      const { phone, skillIds, ...profileData } = input;

      if (skillIds) {
        const count = await tx.skill.count({ where: { id: { in: skillIds }, isActive: true } });
        if (count !== skillIds.length) throw new JobSeekerInvalidSkillsError();
      }

      if (phone !== undefined) {
        try {
          await tx.user.update({ where: { id: userId }, data: { phone } });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new JobSeekerPhoneConflictError();
          }
          throw error;
        }
      }

      const profile = await tx.seekerProfile.upsert({
        where: { userId },
        create: { userId, ...profileData },
        update: profileData,
        select: { id: true },
      });

      if (skillIds) {
        await tx.seekerSkill.deleteMany({
          where: {
            seekerProfileId: profile.id,
            ...(skillIds.length ? { skillId: { notIn: skillIds } } : {}),
          },
        });
        if (skillIds.length) {
          await tx.seekerSkill.createMany({
            data: skillIds.map((skillId) => ({ seekerProfileId: profile.id, skillId })),
            skipDuplicates: true,
          });
        }
      }

      const saved = await tx.seekerProfile.findUniqueOrThrow({
        where: { userId },
        select: profileSelect,
      });
      return toResponse(saved);
    });
  }

  async complete(userId: string): Promise<JobSeekerProfileResponse> {
    return this.prisma.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE`;
      const profile = await tx.seekerProfile.findUnique({
        where: { userId },
        select: profileSelect,
      });
      if (!profile) throw new JobSeekerProfileNotFoundError();
      if (
        !profile.fullName?.trim() ||
        !profile.user.phone?.trim() ||
        !profile.stateName?.trim() ||
        !profile.cityName?.trim() ||
        !profile.experienceLevel
      ) {
        throw new JobSeekerProfileIncompleteError();
      }
      if (profile.completedAt) return toResponse(profile);

      const completed = await tx.seekerProfile.update({
        where: { userId },
        data: { completedAt: new Date() },
        select: profileSelect,
      });
      return toResponse(completed);
    });
  }
}
