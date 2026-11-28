import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { PrivateDocumentStorage } from '@/infrastructure/storage/private-document-storage.js';
import { EmployerVerificationRepository } from '@/modules/admin/repositories/employer-verification.repository.js';
import { PrismaEmployerVerificationRepository } from '@/modules/admin/repositories/prisma-employer-verification.repository.js';
import { EmployerVerificationAdminService } from '@/modules/admin/services/employer-verification-admin.service.js';

describe('admin employer document access', () => {
  const context = { actorId: 'admin-id', ipAddress: null, userAgent: null };
  const tx = {
    employerDocument: { findFirst: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  const prisma = {
    client: { $transaction: vi.fn((operation) => operation(tx)) },
  };
  const storage = { privateDownloadUrl: vi.fn() };
  let service: EmployerVerificationAdminService;

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.client.$transaction.mockImplementation((operation) => operation(tx));
    const module = await Test.createTestingModule({
      providers: [
        EmployerVerificationAdminService,
        { provide: EmployerVerificationRepository, useClass: PrismaEmployerVerificationRepository },
        { provide: PrismaService, useValue: prisma },
        { provide: PrivateDocumentStorage, useValue: storage },
      ],
    }).compile();
    service = module.get(EmployerVerificationAdminService);
  });

  it('audits a matching document before issuing a short-lived access URL', async () => {
    tx.employerDocument.findFirst.mockResolvedValue({ storageAssetId: 'asset-id' });
    storage.privateDownloadUrl.mockImplementation(() => {
      expect(tx.auditLog.create).toHaveBeenCalledOnce();
      return { url: 'https://example.test/download', expiresAt: '2026-11-28T00:01:00.000Z' };
    });

    await expect(service.documentAccess('employer-id', 'document-id', context)).resolves.toEqual({
      url: 'https://example.test/download',
      expiresAt: '2026-11-28T00:01:00.000Z',
    });
    expect(tx.employerDocument.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'document-id',
        employerId: 'employer-id',
        employer: { verificationSubmittedAt: { not: null } },
      },
      select: { storageAssetId: true },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 'admin-id',
        action: 'EMPLOYER_DOCUMENT_ACCESS_REQUESTED',
        entityType: 'EMPLOYER_DOCUMENT',
        entityId: 'document-id',
        metadata: { employerId: 'employer-id' },
        ipAddress: null,
        userAgent: null,
      },
    });
  });

  it('rejects a missing or mismatched document without issuing an access URL', async () => {
    tx.employerDocument.findFirst.mockResolvedValue(null);
    await expect(service.documentAccess('employer-id', 'document-id', context)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(storage.privateDownloadUrl).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it('does not expose legacy evidence with unverified storage settings', async () => {
    tx.employerDocument.findFirst.mockResolvedValue({ storageAssetId: null });
    await expect(service.documentAccess('employer-id', 'document-id', context)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(storage.privateDownloadUrl).not.toHaveBeenCalled();
  });

  it('does not issue an access URL if the audit write fails', async () => {
    tx.employerDocument.findFirst.mockResolvedValue({ storageAssetId: 'asset-id' });
    tx.auditLog.create.mockRejectedValueOnce(new Error('Audit unavailable'));
    await expect(service.documentAccess('employer-id', 'document-id', context)).rejects.toThrow(
      'Audit unavailable',
    );
    expect(storage.privateDownloadUrl).not.toHaveBeenCalled();
  });
});
