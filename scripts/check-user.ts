/**
 * Check User Account Status
 * Diagnostic script to check if a user exists and their account status
 * 
 * Usage: ts-node --project tsconfig.seed.json scripts/check-user.ts <email>
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUser(email: string) {
  try {
    console.log(`\n🔍 Checking user: ${email}\n`);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        password: true, // We'll just check if it exists, not show it
        emailVerified: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.log("❌ User not found in database");
      console.log("\n💡 Possible reasons:");
      console.log("   - User never signed up");
      console.log("   - Email address is incorrect");
      console.log("   - User was deleted");
      return;
    }

    console.log("✅ User found!\n");
    console.log("📋 Account Details:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Password Set: ${user.password ? "✅ Yes" : "❌ No"}`);
    console.log(`   Email Verified: ${user.emailVerified ? "✅ Yes" : "❌ No"}`);
    console.log(`   Onboarding Completed: ${user.onboardingCompleted ? "✅ Yes" : "❌ No"}`);
    console.log(`   Created: ${user.createdAt.toLocaleString()}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Check login eligibility
    if (!user.password) {
      console.log("❌ LOGIN ISSUE: No password set");
      console.log("   → User cannot login without a password");
      console.log("   → Password may need to be reset\n");
    }

    if (user.status === "PENDING") {
      console.log("⚠️  LOGIN ISSUE: Account is PENDING approval");
      console.log("   → User must be approved by an admin before logging in");
      console.log("   → Check admin dashboard for pending approvals\n");
    }

    if (user.status === "REJECTED") {
      console.log("❌ LOGIN ISSUE: Account was REJECTED");
      console.log("   → User cannot login with a rejected account");
      console.log("   → Contact support or approve the account\n");
    }

    if (user.status === "APPROVED" && user.password) {
      console.log("✅ Account is ready for login!");
      console.log("   → If login still fails, the password might be incorrect");
      console.log("   → Try resetting the password\n");
    }

  } catch (error) {
    console.error("❌ Error checking user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address");
  console.log("Usage: ts-node --project tsconfig.seed.json scripts/check-user.ts <email>");
  console.log("Example: ts-node --project tsconfig.seed.json scripts/check-user.ts layoutninja@gmail.com");
  process.exit(1);
}

checkUser(email);

