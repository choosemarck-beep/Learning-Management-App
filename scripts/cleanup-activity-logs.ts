/**
 * Manual cleanup script for activity logs
 * 
 * Usage:
 *   ts-node --project tsconfig.seed.json scripts/cleanup-activity-logs.ts
 * 
 * Or via npm script (if added to package.json):
 *   npm run cleanup-logs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupActivityLogs() {
  try {
    console.log("Starting activity log cleanup...");

    // Get retention settings from environment variables or use defaults
    const retentionDays = parseInt(process.env.ACTIVITY_LOG_RETENTION_DAYS || "90");
    const maxLogCount = parseInt(process.env.ACTIVITY_LOG_MAX_COUNT || "100000");

    console.log(`Retention policy: ${retentionDays} days or max ${maxLogCount} logs`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(`Cutoff date: ${cutoffDate.toISOString()}`);

    // First, delete logs older than retention period
    console.log("Deleting logs older than retention period...");
    const dateResult = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    console.log(`✅ Deleted ${dateResult.count} logs older than ${retentionDays} days`);

    // Then, check if we still exceed max count
    const currentCount = await prisma.activityLog.count();
    console.log(`Current log count: ${currentCount}`);

    if (currentCount > maxLogCount) {
      const toDelete = currentCount - maxLogCount;
      console.log(`Exceeding max count by ${toDelete} logs. Deleting oldest logs...`);

      // Get the oldest logs to delete
      const logsToDelete = await prisma.activityLog.findMany({
        orderBy: {
          createdAt: "asc",
        },
        take: toDelete,
        select: {
          id: true,
        },
      });

      if (logsToDelete.length > 0) {
        const idsToDelete = logsToDelete.map((log) => log.id);
        const countResult = await prisma.activityLog.deleteMany({
          where: {
            id: {
              in: idsToDelete,
            },
          },
        });
        console.log(`✅ Deleted ${countResult.count} oldest logs to meet max count limit`);
      }
    } else {
      console.log(`✅ Log count (${currentCount}) is within limit (${maxLogCount})`);
    }

    const finalCount = await prisma.activityLog.count();
    const totalDeleted = dateResult.count + (currentCount > maxLogCount ? currentCount - finalCount : 0);

    console.log("\n📊 Cleanup Summary:");
    console.log(`   Deleted by date: ${dateResult.count} logs`);
    console.log(`   Deleted by count: ${currentCount > maxLogCount ? currentCount - finalCount : 0} logs`);
    console.log(`   Total deleted: ${totalDeleted} logs`);
    console.log(`   Remaining logs: ${finalCount}`);
    console.log("\n✅ Cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanupActivityLogs()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

