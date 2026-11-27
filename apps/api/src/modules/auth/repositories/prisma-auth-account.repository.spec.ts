import { Test } from '@nestjs/testing';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { PrismaAuthAccountRepository } from './prisma-auth-account.repository.js';

describe('PrismaAuthAccountRepository registration roles', () => {
  const account = { id: 'user-id', emailVerifiedAt: null, status: 'ACTIVE' };
  const tx = {
    user: { create: vi.fn() },
    userAuthProvider: { create: vi.fn() },
  };
  const prisma = {
    client: {
      user: { findUnique: vi.fn() },
      $transaction: vi.fn(),
    },
  };
  let repository: PrismaAuthAccountRepository;

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.client.$transaction.mockImplementation((operation) => operation(tx));
    tx.user.create.mockResolvedValue(account);
    const module = await Test.createTestingModule({
      providers: [PrismaAuthAccountRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();
    repository = module.get(PrismaAuthAccountRepository);
  });

  it('creates a new employer with the selected role', async () => {
    prisma.client.user.findUnique.mockResolvedValue(null);
    await repository.findOrCreateRegistrationAccount({
      email: 'sam@example.com',
      name: 'Sam',
      passwordHash: 'hash',
      role: 'EMPLOYER',
    });
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ primaryRole: 'EMPLOYER' }),
      }),
    );
  });

  it('does not change the role of an existing account', async () => {
    prisma.client.user.findUnique.mockResolvedValue(account);
    await expect(
      repository.findOrCreateRegistrationAccount({
        email: 'sam@example.com',
        name: 'Sam',
        passwordHash: 'hash',
        role: 'EMPLOYER',
      }),
    ).resolves.toEqual(account);
    expect(prisma.client.$transaction).not.toHaveBeenCalled();
  });
});
