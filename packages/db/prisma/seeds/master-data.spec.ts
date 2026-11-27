import assert from "node:assert/strict";
import { test } from "node:test";
import type { Prisma } from "../../src/generated/prisma/client.ts";
import { seedCategories } from "./categories.ts";
import { seedSkills } from "./skills.ts";

test("rerunning master seeds keeps existing IDs, relationships, and inactive flags", async () => {
  type Record = {
    id: string;
    slug: string;
    name: string;
    isActive: boolean;
    parentId?: string | null;
  };
  const records = new Map<string, Record>();
  records.set("retail-sales", {
    id: "existing-id", slug: "retail-sales", name: "Custom label",
    isActive: false, parentId: "existing-parent",
  });

  const upsert = async (input: {
    where: { slug: string };
    create: { slug: string; name: string };
    update: { name: string };
  }) => {
    const existing = records.get(input.where.slug);
    const record = existing
      ? { ...existing, ...input.update }
      : { id: `id-${records.size}`, isActive: true, ...input.create };
    records.set(input.where.slug, record);
    return record;
  };
  const tx = {
    jobCategory: { upsert },
    skill: { upsert },
  } as unknown as Prisma.TransactionClient;

  await seedCategories(tx);
  const categoryIds = [...records.values()].map((record) => record.id);
  await seedCategories(tx);
  assert.deepEqual([...records.values()].map((record) => record.id), categoryIds);
  assert.equal(records.get("retail-sales")?.isActive, false);
  assert.equal(records.get("retail-sales")?.parentId, "existing-parent");
  assert.equal(records.get("retail-sales")?.id, "existing-id");
  records.clear();
  await seedSkills(tx);
  const skillIds = [...records.values()].map((record) => record.id);
  await seedSkills(tx);
  assert.deepEqual([...records.values()].map((record) => record.id), skillIds);
});
