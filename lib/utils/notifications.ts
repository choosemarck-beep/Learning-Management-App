import { prisma } from "@/lib/prisma/client";

/**
 * Send a training update notification to a user
 * Used when training content is added and affects their completion status
 * 
 * @param userId - The user ID to notify
 * @param trainingId - The training ID that was updated
 * @param trainingTitle - The training title for the notification
 */
export async function notifyTrainingUpdate(
  userId: string,
  trainingId: string,
  trainingTitle: string
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: userId,
        type: "training_update",
        title: `Training Updated: ${trainingTitle}`,
        content:
          "New content has been added to this training. Please complete it to maintain 100% completion.",
        link: `/courses/training/${trainingId}`,
        isRead: false,
      },
    });
  } catch (error) {
    console.error(`Error creating notification for user ${userId}:`, error);
    // Don't throw - notification failure shouldn't break the update process
  }
}

/**
 * Send training update notifications to multiple users
 * 
 * @param userIds - Array of user IDs to notify
 * @param trainingId - The training ID that was updated
 * @param trainingTitle - The training title for the notification
 */
export async function notifyTrainingUpdateBatch(
  userIds: string[],
  trainingId: string,
  trainingTitle: string
): Promise<void> {
  if (userIds.length === 0) {
    return;
  }

  try {
    // Create notifications in batch
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId: userId,
        type: "training_update",
        title: `Training Updated: ${trainingTitle}`,
        content:
          "New content has been added to this training. Please complete it to maintain 100% completion.",
        link: `/courses/training/${trainingId}`,
        isRead: false,
      })),
      skipDuplicates: true, // Skip if notification already exists
    });
  } catch (error) {
    console.error(`Error creating batch notifications:`, error);
    // Fallback to individual notifications if batch fails
    for (const userId of userIds) {
      try {
        await notifyTrainingUpdate(userId, trainingId, trainingTitle);
      } catch (err) {
        console.error(`Error creating notification for user ${userId}:`, err);
      }
    }
  }
}

