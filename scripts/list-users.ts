import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          notIn: ["ADMIN", "SUPER_ADMIN"],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        employeeNumber: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("\n=== Non-Admin Users in Database ===\n");
    console.log(`Total: ${users.length} users\n`);

    if (users.length === 0) {
      console.log("No non-admin users found.");
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Employee #: ${user.employeeNumber || "N/A"}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
        console.log(`   ID: ${user.id}`);
        console.log("");
      });
    }

    return users;
  } catch (error) {
    console.error("Error listing users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

listUsers()
  .then(() => {
    console.log("\n✅ User list complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

