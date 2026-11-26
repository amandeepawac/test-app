import { Injectable } from '@nestjs/common';
import type { AdminAuditLogListResponse, AdminAuditLogQuery } from '@repo/contracts';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { AuditLogRepository } from './audit-log.repository.js';

@Injectable()
export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminAuditLogQuery): Promise<AdminAuditLogListResponse> {
    const where = {
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };
    const [records, total] = await Promise.all([
      this.prisma.client.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          actor: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.client.auditLog.count({ where }),
    ]);

    return {
      items: records.map((record) => ({ ...record, createdAt: record.createdAt.toISOString() })),
      pageInfo: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        hasNextPage: query.page * query.pageSize < total,
      },
    };
  }
}
