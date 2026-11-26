import { Injectable } from '@nestjs/common';
import type { EmployerProfileResponse, EmployerProfileUpdate } from '@repo/contracts';
import type { Prisma } from '@repo/db/generated';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import {
  EmployerIdentityChangeConflictError,
  EmployerProfileIncompleteError,
  EmployerProfileNotFoundError,
} from '@/modules/employers/employer-errors.js';
import { EmployerProfileRepository } from './employer-profile.repository.js';

const profileSelect = {
  id: true,
  businessName: true,
  employerType: true,
  contactPersonName: true,
  businessPhone: true,
  stateName: true,
  cityName: true,
  businessDescription: true,
  addressLine: true,
  websiteUrl: true,
  showEmail: true,
  showPhone: true,
  completedAt: true,
  verificationStatus: true,
  verificationLevel: true,
  verificationSubmittedAt: true,
  verifiedAt: true,
  rejectionReason: true,
  verificationNote: true,
  user: { select: { email: true } },
} satisfies Prisma.EmployerProfileSelect;

type ProfileRecord = Prisma.EmployerProfileGetPayload<{ select: typeof profileSelect }>;

function toResponse(profile: ProfileRecord): EmployerProfileResponse {
  return {
    id: profile.id,
    businessName: profile.businessName,
    employerType: profile.employerType,
    contactPersonName: profile.contactPersonName,
    businessPhone: profile.businessPhone,
    email: profile.user.email,
    stateName: profile.stateName,
    cityName: profile.cityName,
    businessDescription: profile.businessDescription,
    addressLine: profile.addressLine,
    websiteUrl: profile.websiteUrl,
    showEmail: profile.showEmail,
    showPhone: profile.showPhone,
    completedAt: profile.completedAt?.toISOString() ?? null,
    verification: {
      verificationStatus: profile.verificationStatus,
      verificationLevel: profile.verificationLevel,
      verificationSubmittedAt: profile.verificationSubmittedAt?.toISOString() ?? null,
      verifiedAt: profile.verifiedAt?.toISOString() ?? null,
      rejectionReason: profile.rejectionReason,
      verificationNote: profile.verificationNote,
    },
  };
}

@Injectable()
export class PrismaEmployerProfileRepository implements EmployerProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<EmployerProfileResponse | null> {
    const profile = await this.prisma.client.employerProfile.findUnique({
      where: { userId },
      select: profileSelect,
    });
    return profile ? toResponse(profile) : null;
  }

  async save(userId: string, input: EmployerProfileUpdate): Promise<EmployerProfileResponse> {
    return this.prisma.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "employer_profiles" WHERE "userId" = ${userId}::uuid FOR UPDATE`;
      const current = await tx.employerProfile.findUnique({
        where: { userId },
        select: { businessName: true, employerType: true, verificationStatus: true },
      });
      if (
        current &&
        current.verificationStatus !== 'NOT_SUBMITTED' &&
        ((input.businessName !== undefined && input.businessName !== current.businessName) ||
          (input.employerType !== undefined && input.employerType !== current.employerType))
      ) {
        throw new EmployerIdentityChangeConflictError();
      }

      const profile = await tx.employerProfile.upsert({
        where: { userId },
        create: { userId, ...input },
        update: input,
        select: profileSelect,
      });
      return toResponse(profile);
    });
  }

  async complete(userId: string): Promise<EmployerProfileResponse> {
    return this.prisma.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "employer_profiles" WHERE "userId" = ${userId}::uuid FOR UPDATE`;
      const profile = await tx.employerProfile.findUnique({
        where: { userId },
        select: profileSelect,
      });
      if (!profile) throw new EmployerProfileNotFoundError();
      if (
        !profile.businessName?.trim() ||
        !profile.employerType ||
        !profile.contactPersonName?.trim() ||
        !profile.businessPhone?.trim() ||
        !profile.stateName?.trim() ||
        !profile.cityName?.trim()
      ) {
        throw new EmployerProfileIncompleteError();
      }
      if (profile.completedAt) return toResponse(profile);

      const completed = await tx.employerProfile.update({
        where: { userId },
        data: { completedAt: new Date() },
        select: profileSelect,
      });
      return toResponse(completed);
    });
  }
}
