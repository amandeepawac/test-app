import prisma from "../src/client.ts";
import { seedCategories } from "./seeds/categories.ts";
import { seedSkills } from "./seeds/skills.ts";

try {
  const counts = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('rozgarlocal-master-data'))::text`;
      return {
        categories: await seedCategories(tx),
        skills: await seedSkills(tx),
      };
    },
    { timeout: 120_000 },
  );
  console.log("Master data seeded:", counts);
} catch (error) {
  console.error("Master data seeding failed:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
