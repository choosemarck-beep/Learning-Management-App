/**
 * Reset User Password
 * Resets a user's password to a new value
 * 
 * Usage: ts-node --project tsconfig.seed.json scripts/reset-user-password.ts <email> <newPassword>
 * 
 * Example: ts-node --project tsconfig.seed.json scripts/reset-user-password.ts layoutninja@gmail.com NewPassword123!
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetPassword(email: string, newPassword: string) {
  try {
    console.log(`\n🔐 Resetting password for: ${email}\n`);

    // Validate password requirements
    if (newPassword.length < 8) {
      console.error("❌ Password must be at least 8 characters");
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
      console.error("❌ Password must contain:");
      console.error("   - At least one uppercase letter");
      console.error("   - At least one lowercase letter");
      console.error("   - At least one number");
      console.error("   - At least one special character (@$!%*?&)");
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }

    if (user.status !== "APPROVED") {
      console.error(`⚠️  Warning: User status is ${user.status}, not APPROVED`);
      console.log("   Password will still be reset, but user may not be able to login until approved.");
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    console.log("✅ Password reset successfully!\n");
    console.log("📋 Updated Account:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   New Password: ${newPassword}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("💡 User can now login with the new password\n");

  } catch (error) {
    console.error("❌ Error resetting password:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error("❌ Please provide email and new password");
  console.log("\nUsage: ts-node --project tsconfig.seed.json scripts/reset-user-password.ts <email> <newPassword>");
  console.log("\nExample:");
  console.log('  ts-node --project tsconfig.seed.json scripts/reset-user-password.ts layoutninja@gmail.com "NewPassword123!"');
  console.log("\nPassword Requirements:");
  console.log("  - At least 8 characters");
  console.log("  - At least one uppercase letter");
  console.log("  - At least one lowercase letter");
  console.log("  - At least one number");
  console.log("  - At least one special character (@$!%*?&)");
  process.exit(1);
}

resetPassword(email, newPassword);

