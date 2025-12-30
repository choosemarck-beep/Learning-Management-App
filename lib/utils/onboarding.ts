import { prisma } from "@/lib/prisma/client";

/**
 * Creates a welcome message in the user's inbox
 * @param userId - The ID of the user to receive the welcome message
 * @param userName - The name of the user
 * @returns Promise<boolean> - Returns true if message was created successfully
 */
export async function createWelcomeMessage(
  userId: string,
  userName: string
): Promise<boolean> {
  try {
    // Check if welcome message already exists for this user
    const existingMessage = await prisma.message.findFirst({
      where: {
        recipientId: userId,
        subject: "Welcome to Learning Management!",
      },
    });

    if (existingMessage) {
      // Welcome message already exists, don't create duplicate
      return false;
    }

    // Create welcome message
    // Use system user ID or create a system sender
    // For now, we'll use the user's own ID as sender (self-message)
    // In the future, we could create a system user
    await prisma.message.create({
      data: {
        senderId: userId, // Self-message for now
        recipientId: userId,
        subject: "Welcome to Learning Management!",
        content: `Welcome, ${userName}!

We're excited to have you join our learning platform. Your learning journey starts here!

Here's what you can do:
• Complete your profile to get started
• Explore courses and start learning
• Track your progress and earn XP
• Connect with your team and see leaderboards

If you have any questions, feel free to reach out to our support team.

Happy learning!`,
        isRead: false,
      },
    });

    return true;
  } catch (error) {
    console.error("[createWelcomeMessage] Error creating welcome message:", error);
    return false;
  }
}

