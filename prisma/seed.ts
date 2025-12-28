import { PrismaClient, CompanyType, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create Companies (matching the frontend DEFAULT_COMPANIES list)
  const companyData = [
    // Companies (Direct Hire)
    { name: "AB Leisure Exponent Inc.", type: CompanyType.COMPANY },
    { name: "Allpoint Leisure Corporation", type: CompanyType.COMPANY },
    { name: "Alpha One Amusement and Recreation Corp.", type: CompanyType.COMPANY },
    { name: "Big Time Gaming Corporation", type: CompanyType.COMPANY },
    { name: "Bingo Extravaganza Inc.", type: CompanyType.COMPANY },
    { name: "Bingo Palace Corporation", type: CompanyType.COMPANY },
    { name: "First Leisure And Game Co. Inc.", type: CompanyType.COMPANY },
    { name: "Grand Polaris Gaming Co., Inc.", type: CompanyType.COMPANY },
    { name: "Highland Gaming Corporation", type: CompanyType.COMPANY },
    { name: "Iloilo Bingo Corporation", type: CompanyType.COMPANY },
    { name: "Isarog Gaming Corporation", type: CompanyType.COMPANY },
    { name: "Manila Bingo Corporation", type: CompanyType.COMPANY },
    { name: "Metro Gaming Entertainment Gallery Inc.", type: CompanyType.COMPANY },
    { name: "Negrense Entertainment Gallery inc.", type: CompanyType.COMPANY },
    { name: "One Bingo Pavilion Inc.", type: CompanyType.COMPANY },
    { name: "One Bingo Place Inc.", type: CompanyType.COMPANY },
    { name: "Rizal Gaming Corporation", type: CompanyType.COMPANY },
    { name: "SG Amusement And Recreation Corp.", type: CompanyType.COMPANY },
    { name: "South Bingo Corporation", type: CompanyType.COMPANY },
    { name: "South Entertainment Gallery Incorporated", type: CompanyType.COMPANY },
    { name: "Summit Bingo Inc.", type: CompanyType.COMPANY },
    { name: "Topmost Gaming Corporation", type: CompanyType.COMPANY },
    { name: "Topnotch Bingo Trend Inc.", type: CompanyType.COMPANY },
    { name: "Total Gamezone Xtreme Incorporated", type: CompanyType.COMPANY },
    // Agencies
    { name: "Aglipay Security Agency", type: CompanyType.AGENCY },
    { name: "Consult Asia Business Solutions and ADvisory Services Inc.", type: CompanyType.AGENCY },
    { name: "Globalink Employment Services Inc.", type: CompanyType.AGENCY },
    { name: "Gamexperience Employment Services Inc.", type: CompanyType.AGENCY },
    { name: "Greatwall Manpower And General Services Inc.", type: CompanyType.AGENCY },
    { name: "Growvite Staffing Services Inc.", type: CompanyType.AGENCY },
    { name: "Merit Security Agency", type: CompanyType.AGENCY },
    { name: "One Merit Global Security Investigation Agency", type: CompanyType.AGENCY },
    { name: "Sehwani Manpower Corporation, International", type: CompanyType.AGENCY },
    { name: "Serendipity Multi Purpose Cooperative", type: CompanyType.AGENCY },
    { name: "Smart Career Outsourcing Services Co.", type: CompanyType.AGENCY },
    { name: "Steadfast Services Cooperative", type: CompanyType.AGENCY },
    { name: "Sunrise Security Services Inc.", type: CompanyType.AGENCY },
    { name: "Ultimate Templar Manpower & Allied Services Inc.", type: CompanyType.AGENCY },
  ];

  const companies = await Promise.all(
    companyData.map((company) =>
      prisma.company.upsert({
        where: { name: company.name },
        update: {},
        create: {
          name: company.name,
          type: company.type,
          isActive: true,
        },
      })
    )
  );

  console.log(`✅ Created ${companies.length} companies`);

  // Create Positions (matching the frontend DEFAULT_POSITIONS list)
  const positionData = [
    { title: "Regional Manager", role: UserRole.BRANCH_MANAGER },
    { title: "Area Manager", role: UserRole.BRANCH_MANAGER },
    { title: "Branch Manager", role: UserRole.BRANCH_MANAGER },
    { title: "Trainer", role: UserRole.TRAINER },
    { title: "Operations Supervisor", role: UserRole.EMPLOYEE },
    { title: "Senior Cashier", role: UserRole.EMPLOYEE },
    { title: "Cashier", role: UserRole.EMPLOYEE },
    { title: "Bingo Host", role: UserRole.EMPLOYEE },
    { title: "Gaming Attendant", role: UserRole.EMPLOYEE },
    { title: "Card Allocator", role: UserRole.EMPLOYEE },
    { title: "Bingo Technician", role: UserRole.EMPLOYEE },
    { title: "Security Guard", role: UserRole.EMPLOYEE },
    { title: "Utility", role: UserRole.EMPLOYEE },
  ];

  const positions = await Promise.all(
    positionData.map((position) =>
      prisma.position.upsert({
        where: { title: position.title },
        update: {},
        create: {
          title: position.title,
          role: position.role,
          isActive: true,
        },
      })
    )
  );

  console.log(`✅ Created ${positions.length} positions`);

  // Create Admin Users (for development/testing)
  // Default password: "Admin123!" (meets password requirements)
  const defaultAdminPassword = await bcrypt.hash("Admin123!", 10);
  const defaultSuperAdminPassword = await bcrypt.hash("SuperAdmin123!", 10);

  // Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@lms.app" },
    update: {},
    create: {
      email: "superadmin@lms.app",
      name: "Super Admin",
      password: defaultSuperAdminPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.APPROVED,
      emailVerified: true,
      onboardingCompleted: true,
      xp: 0,
      level: 1,
      rank: "Deckhand",
      streak: 0,
      diamonds: 0,
    },
  });

  console.log(`✅ Created Super Admin: ${superAdmin.email} (password: SuperAdmin123!)`);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@lms.app" },
    update: {},
    create: {
      email: "admin@lms.app",
      name: "Admin",
      password: defaultAdminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
      emailVerified: true,
      onboardingCompleted: true,
      xp: 0,
      level: 1,
      rank: "Deckhand",
      streak: 0,
      diamonds: 0,
    },
  });

  console.log(`✅ Created Admin: ${admin.email} (password: Admin123!)`);

  console.log("\n📝 Admin Login Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Super Admin:");
  console.log("  Email: superadmin@lms.app");
  console.log("  Password: SuperAdmin123!");
  console.log("  Dashboard: http://localhost:3000/super-admin/dashboard");
  console.log("\nAdmin:");
  console.log("  Email: admin@lms.app");
  console.log("  Password: Admin123!");
  console.log("  Dashboard: http://localhost:3000/admin/dashboard");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

