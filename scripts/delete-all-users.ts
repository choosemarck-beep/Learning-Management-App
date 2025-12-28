/**
 * Script to delete all users from the database
 * Usage: npx tsx scripts/delete-all-users.ts
 * 
 * WARNING: This will delete ALL users. Use with caution!
 */

import { prisma } from "../lib/prisma/client";

async function deleteAllUsers() {
  try {
    console.log("🗑️  Starting to delete all users...");

    // Count users before deletion
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} user(s) in the database`);

    if (userCount === 0) {
      console.log("✅ No users to delete. Database is already empty.");
      return;
    }

    // Delete all users
    // Note: This will also delete related records due to cascade deletes
    const result = await prisma.user.deleteMany({});

    console.log(`✅ Successfully deleted ${result.count} user(s)`);
    console.log("🎉 Database cleanup complete!");
  } catch (error) {
    console.error("❌ Error deleting users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteAllUsers()
  .then(() => {
    console.log("✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });

