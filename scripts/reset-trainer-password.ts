import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetTrainerPassword() {
  try {
    // Get email and password from command line arguments or environment
    const trainerEmail = process.argv[2] || process.env.TRAINER_EMAIL;
    const newPassword = process.argv[3] || process.env.TRAINER_NEW_PASSWORD;

    if (!trainerEmail || !newPassword) {
      console.error("❌ Usage: npm run reset-trainer-password <email> <new-password>");
      console.error("   Or set TRAINER_EMAIL and TRAINER_NEW_PASSWORD environment variables");
      process.exit(1);
    }

    // Find the trainer user
    const trainer = await prisma.user.findUnique({
      where: { email: trainerEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!trainer) {
      console.error(`❌ Trainer with email ${trainerEmail} not found.`);
      return;
    }

    console.log(`\n=== Resetting Password for Trainer ===`);
    console.log(`Name: ${trainer.name}`);
    console.log(`Email: ${trainer.email}`);
    console.log(`Role: ${trainer.role}`);
    console.log(`\nNew Password: ${newPassword}\n`);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await prisma.user.update({
      where: { id: trainer.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Password reset successfully!");
    console.log(`\nTrainer credentials:`);
    console.log(`Email: ${trainerEmail}`);
    console.log(`Password: ${newPassword}`);
    console.log(`\n⚠️  Please save these credentials securely.`);
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetTrainerPassword()
  .then(() => {
    console.log("\n✅ Password reset complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

