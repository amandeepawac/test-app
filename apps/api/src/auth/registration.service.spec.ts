import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHash } from 'node:crypto';
import { PrismaService } from '../database/prisma.service.js';
import { PasswordService } from './password.service.js';
import { RegistrationService } from './registration.service.js';
import { VerificationMailService } from './verification-mail.service.js';

describe('RegistrationService', () => {
  const user = { id: 'user-id', emailVerifiedAt: null, status: 'ACTIVE' };
  const tx = {
    user: { updateMany: vi.fn() },
    emailVerificationToken: { findFirst: vi.fn(), updateMany: vi.fn() },
    passwordCredential: { upsert: vi.fn() },
    userAuthProvider: { upsert: vi.fn() },
  };
  const db = {
    user: { findUnique: vi.fn(), create: vi.fn() },
    emailVerificationToken: { create: vi.fn() },
    $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<void>) => callback(tx)),
  };
  const passwords = { hash: vi.fn() };
  const mail = { getSettings: vi.fn(), send: vi.fn() };
  let service: RegistrationService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RegistrationService,
        { provide: PrismaService, useValue: { client: db } },
        { provide: PasswordService, useValue: passwords },
        { provide: VerificationMailService, useValue: mail },
      ],
    }).compile();
    service = module.get(RegistrationService);
    passwords.hash.mockResolvedValue('password-hash');
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue(user);
    mail.send.mockResolvedValue(undefined);
  });

  it('creates a credential and identity and stores only a hashed verification token', async () => {
    await service.register({ name: 'Example', email: 'user@example.com', password: 'password123' });

    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'user@example.com',
          passwordCredential: { create: { passwordHash: 'password-hash' } },
          authProviders: {
            create: { provider: 'EMAIL_PASSWORD', providerUserId: expect.any(String) },
          },
        }),
      }),
    );
    const token = mail.send.mock.calls[0]?.[1];
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(db.emailVerificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: user.id,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        pendingPasswordHash: 'password-hash',
      }),
    });
  });

  it('does not replace existing credentials before email ownership is verified', async () => {
    db.user.findUnique.mockResolvedValue(user);
    await service.register({ name: 'Example', email: 'user@example.com', password: 'password123' });
    expect(db.user.create).not.toHaveBeenCalled();
    expect(db.emailVerificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ pendingPasswordHash: 'password-hash' }),
    });
  });

  it('sends a generic notification for an already verified account', async () => {
    db.user.findUnique.mockResolvedValue({ ...user, emailVerifiedAt: new Date() });
    await service.register({ name: 'Example', email: 'user@example.com', password: 'password123' });
    expect(db.emailVerificationToken.create).not.toHaveBeenCalled();
    expect(mail.send).toHaveBeenCalledWith('user@example.com', undefined);
  });

  it('uses the password attached to the verified link and invalidates other links', async () => {
    tx.emailVerificationToken.findFirst.mockResolvedValue({
      userId: user.id,
      pendingPasswordHash: 'password-from-link',
    });
    tx.user.updateMany.mockResolvedValue({ count: 1 });
    tx.emailVerificationToken.updateMany.mockResolvedValue({ count: 1 });

    await service.verifyEmail('token');

    expect(tx.passwordCredential.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ passwordHash: 'password-from-link' }),
      }),
    );
    expect(tx.emailVerificationToken.updateMany).toHaveBeenLastCalledWith({
      where: { userId: user.id },
      data: { consumedAt: expect.any(Date), pendingPasswordHash: null },
    });
  });

  it('rejects expired, consumed, and already verified links', async () => {
    tx.emailVerificationToken.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      userId: user.id,
      pendingPasswordHash: 'password-hash',
    });
    tx.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.verifyEmail('expired')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.verifyEmail('used')).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.passwordCredential.upsert).not.toHaveBeenCalled();
  });

  it('does not set credentials if the token expires while being consumed', async () => {
    tx.emailVerificationToken.findFirst.mockResolvedValue({
      userId: user.id,
      pendingPasswordHash: 'password-hash',
    });
    tx.user.updateMany.mockResolvedValue({ count: 1 });
    tx.emailVerificationToken.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.verifyEmail('expired')).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.passwordCredential.upsert).not.toHaveBeenCalled();
  });
});
