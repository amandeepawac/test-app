import { argon2id, hash } from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@repo/db/generated';
import { fileURLToPath } from 'node:url';

process.loadEnvFile(fileURLToPath(new URL('../../../.env', import.meta.url)));

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required to seed demo users.`);
  return value;
}

const connectionString = requiredEnv('DATABASE_URL');
const seedAccounts = [
  {
    email: requiredEnv('SEED_ADMIN_EMAIL'),
    name: process.env.SEED_ADMIN_NAME?.trim() || 'Demo Admin',
    password: requiredEnv('SEED_ADMIN_PASSWORD'),
    primaryRole: 'ADMIN',
  },
  {
    email: requiredEnv('SEED_EMPLOYER_EMAIL'),
    name: process.env.SEED_EMPLOYER_NAME?.trim() || 'Demo Employer',
    password: requiredEnv('SEED_EMPLOYER_PASSWORD'),
    primaryRole: 'EMPLOYER',
  },
  {
    email: requiredEnv('SEED_JOB_SEEKER_EMAIL'),
    name: process.env.SEED_JOB_SEEKER_NAME?.trim() || 'Demo Job Seeker',
    password: requiredEnv('SEED_JOB_SEEKER_PASSWORD'),
    primaryRole: 'JOB_SEEKER',
  },
];

if (new Set(seedAccounts.map(({ email }) => email.toLowerCase())).size !== seedAccounts.length) {
  throw new Error('Each seeded role must use a different email address.');
}

const passwordHashes = await Promise.all(
  seedAccounts.map(({ password }) =>
    hash(password, { type: argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 }),
  ),
);

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

try {
  const seededUsers = await prisma.$transaction(async (tx) => {
    const users = [];

    for (const [index, account] of seedAccounts.entries()) {
      const now = new Date();
      const user = await tx.user.upsert({
        where: { email: account.email },
        create: {
          email: account.email,
          name: account.name,
          primaryRole: account.primaryRole,
          status: 'ACTIVE',
          emailVerifiedAt: now,
        },
        update: {
          name: account.name,
          primaryRole: account.primaryRole,
          status: 'ACTIVE',
          emailVerifiedAt: now,
        },
        select: { id: true, email: true, name: true, primaryRole: true },
      });

      await tx.passwordCredential.upsert({
        where: { userId: user.id },
        create: { userId: user.id, passwordHash: passwordHashes[index] },
        update: { passwordHash: passwordHashes[index], passwordChangedAt: now },
      });

      await tx.userAuthProvider.upsert({
        where: { userId_provider: { userId: user.id, provider: 'EMAIL_PASSWORD' } },
        create: {
          userId: user.id,
          provider: 'EMAIL_PASSWORD',
          providerUserId: user.id,
        },
        update: { providerUserId: user.id },
      });

      if (account.primaryRole === 'EMPLOYER') {
        await tx.employerProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, businessName: `${account.name}'s Business` },
          update: { businessName: `${account.name}'s Business` },
        });
      } else if (account.primaryRole === 'JOB_SEEKER') {
        await tx.seekerProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, fullName: account.name },
          update: { fullName: account.name },
        });
      }

      users.push(user);
    }

    return users;
  });

  console.log('Seeded demo accounts:');
  for (const user of seededUsers) {
    console.log(`- ${user.primaryRole}: ${user.name} <${user.email}>`);
  }
} finally {
  await prisma.$disconnect();
}
