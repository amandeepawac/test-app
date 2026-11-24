import prisma from "../src/client.ts";

async function testDatabase() {
  console.log("Testing Prisma Postgres connection...\n");

  try {
    console.log("Creating a test user...");
    const newUser = await prisma.user.create({
      data: {
        email: "demo@example.com",
        name: "Demo User",
      },
    });
    console.log("Created user:", newUser);

    console.log("\nFetching all users...");
    const allUsers = await prisma.user.findMany();
    console.log(`Found ${allUsers.length} user(s):`);
    allUsers.forEach((user) => {
      console.log(`  - ${user.name ?? "Unnamed"} (${user.email})`);
    });

    console.log("\nAll database tests passed.");
  } catch (error) {
    console.error("Database test failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
