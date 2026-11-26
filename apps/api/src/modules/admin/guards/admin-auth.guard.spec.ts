import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/infrastructure/database/prisma.service.js';
import { AuthService } from '@/modules/auth/services/auth.service.js';
import { AdminAuthGuard } from './admin-auth.guard.js';

describe('AdminAuthGuard', () => {
  const auth = { currentUser: vi.fn() };
  const prisma = { client: { user: { findUnique: vi.fn() } } };
  let guard: AdminAuthGuard;

  const context = (authorization?: string) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ headers: { authorization } }) }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AdminAuthGuard,
        { provide: AuthService, useValue: auth },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    guard = module.get(AdminAuthGuard);
  });

  it('rejects requests without a bearer token', async () => {
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
    expect(auth.currentUser).not.toHaveBeenCalled();
  });

  it('denies authenticated non-admin users', async () => {
    auth.currentUser.mockResolvedValue({ id: 'user-id' });
    prisma.client.user.findUnique.mockResolvedValue({ primaryRole: 'JOB_SEEKER' });

    await expect(guard.canActivate(context('Bearer access-token'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows authenticated administrators', async () => {
    auth.currentUser.mockResolvedValue({ id: 'admin-id' });
    prisma.client.user.findUnique.mockResolvedValue({ primaryRole: 'ADMIN' });

    await expect(guard.canActivate(context('Bearer access-token'))).resolves.toBe(true);
    expect(auth.currentUser).toHaveBeenCalledWith('access-token');
  });
});
