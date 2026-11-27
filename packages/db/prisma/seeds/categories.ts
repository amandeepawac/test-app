import type { Prisma } from "../../src/generated/prisma/client.ts";

export const categories = [
  { slug: "driving-delivery", name: "Driving and delivery" },
  { slug: "retail-sales", name: "Retail and sales" },
  { slug: "hospitality-food", name: "Hospitality and food service" },
  { slug: "manufacturing-production", name: "Manufacturing and production" },
  { slug: "warehouse-logistics", name: "Warehouse and logistics" },
  { slug: "construction-trades", name: "Construction and skilled trades" },
  { slug: "repair-maintenance", name: "Repair and maintenance" },
  { slug: "office-administration", name: "Office and administration" },
  { slug: "customer-support", name: "Customer support" },
  { slug: "healthcare-caregiving", name: "Healthcare and caregiving" },
  { slug: "education-training", name: "Education and training" },
  { slug: "agriculture", name: "Agriculture" },
  { slug: "domestic-housekeeping", name: "Domestic work and housekeeping" },
  { slug: "security", name: "Security" },
  { slug: "beauty-wellness", name: "Beauty and wellness" },
  { slug: "it-digital", name: "IT and digital services" },
  { slug: "passenger-transport", name: "Passenger transport" },
  { slug: "finance-accounting", name: "Finance and accounting" },
  { slug: "textiles-garments", name: "Textiles and garments" },
  { slug: "property-facilities", name: "Property and facilities services" },
  { slug: "waste-recycling", name: "Waste management and recycling" },
  { slug: "events-entertainment", name: "Events and entertainment" },
  { slug: "other", name: "Other" },
] as const;

export async function seedCategories(
  tx: Prisma.TransactionClient,
): Promise<number> {
  for (const [sortOrder, category] of categories.entries()) {
    await tx.jobCategory.upsert({
      where: { slug: category.slug },
      create: { ...category, sortOrder },
      update: { name: category.name, sortOrder },
    });
  }
  return categories.length;
}
