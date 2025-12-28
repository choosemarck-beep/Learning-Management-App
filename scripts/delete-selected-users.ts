import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Script to delete selected users from the database
 * Usage: npx tsx scripts/delete-selected-users.ts <userId1> <userId2> ...
 * 
 * Example: npx tsx scripts/delete-selected-users.ts cmjipcz6x0005nfqr6xc4v6xh cmji8cmsz0003nfqrp8ix0r3h
 * 
 * WARNING: This will permanently delete users and their related data!
 */

async function deleteSelectedUsers(userIds: string[]) {
  try {
    if (userIds.length === 0) {
      console.log("❌ No user IDs provided. Please provide user IDs to delete.");
      console.log("\nUsage: npx tsx scripts/delete-selected-users.ts <userId1> <userId2> ...");
      return;
    }

    console.log("🗑️  Starting to delete selected users...\n");

    // First, verify these users exist and are not admins
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    // Check for admin users
    const adminUsers = users.filter(
      (u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN"
    );

    if (adminUsers.length > 0) {
      console.log("❌ Cannot delete admin users:");
      adminUsers.forEach((u) => {
        console.log(`   - ${u.name} (${u.email}) - ${u.role}`);
      });
      console.log("\n⚠️  Skipping admin users. Only non-admin users will be deleted.\n");
    }

    // Filter out admin users
    const nonAdminUsers = users.filter(
      (u) => u.role !== "ADMIN" && u.role !== "SUPER_ADMIN"
    );

    if (nonAdminUsers.length === 0) {
      console.log("❌ No non-admin users found to delete.");
      return;
    }

    // Check for users not found
    const foundIds = users.map((u) => u.id);
    const notFoundIds = userIds.filter((id) => !foundIds.includes(id));

    if (notFoundIds.length > 0) {
      console.log("⚠️  Warning: Some user IDs were not found:");
      notFoundIds.forEach((id) => console.log(`   - ${id}`));
      console.log("");
    }

    // Show users that will be deleted
    console.log("📋 Users that will be deleted:");
    nonAdminUsers.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.status}`
      );
    });
    console.log("");

    // Delete users
    const deleteIds = nonAdminUsers.map((u) => u.id);
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: deleteIds },
      },
    });

    console.log(`✅ Successfully deleted ${result.count} user(s)`);
    console.log("🎉 Database cleanup complete!");
  } catch (error) {
    console.error("❌ Error deleting users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get user IDs from command line arguments
const userIds = process.argv.slice(2);

// Run the script
deleteSelectedUsers(userIds)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });

