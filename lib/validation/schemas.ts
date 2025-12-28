import { z } from "zod";

// User Role Enum
const UserRoleEnum = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "BRANCH_MANAGER",
  "EMPLOYEE",
  "REGIONAL_MANAGER",
  "AREA_MANAGER",
  "TRAINER",
]);

// User Status Enum
const UserStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED", "RESIGNED"]);

// Announcement Type Enum
const AnnouncementTypeEnum = z.enum([
  "GENERAL",
  "QUIZ",
  "NEW_TRAINING",
  "IMPORTANT",
]);

/**
 * User Update Schema (Admin)
 * Used for updating user information by admin/super admin
 */
export const userUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 characters").optional().nullable(),
  employeeNumber: z.string().min(1, "Employee number is required").optional().nullable(),
  department: z.string().min(1, "Department is required").optional().nullable(),
  branch: z.string().min(1, "Branch is required").optional().nullable(),
  hireDate: z.string().optional().nullable(), // ISO date string
  companyId: z.string().min(1, "Company ID is required").optional().nullable(),
  positionId: z.string().min(1, "Position ID is required").optional().nullable(),
  role: UserRoleEnum.optional(),
  status: UserStatusEnum.optional(),
});

/**
 * Profile Update Schema (Employee/Branch Manager/Trainer)
 * Used for updating own profile information
 */
export const profileUpdateSchema = z.object({
  onboardingCompleted: z.boolean().optional(),
});

/**
 * Course Update Schema (Trainer)
 * Used for updating course information (requires password verification)
 */
export const courseUpdateSchema = z.object({
  password: z.string().min(1, "Password is required"),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  thumbnail: z
    .preprocess(
      (val) => {
        // Convert empty strings, null, or undefined to null
        if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
          return null;
        }
        return typeof val === "string" ? val.trim() : val;
      },
      z
        .union([z.string(), z.null()])
        .refine(
          (val) => {
            if (val === null) return true;
            // Accept relative paths (starting with /) or full URLs
            if (val.startsWith("/")) {
              return true; // Relative path is valid
            }
            // Try to validate as URL for full URLs
            try {
              new URL(val);
              return true;
            } catch {
              return false;
            }
          },
          { message: "Invalid thumbnail URL or path" }
        )
    )
    .optional()
    .nullable(),
  totalXP: z.number().int().min(0, "Total XP must be non-negative").optional(),
  isPublished: z.boolean().optional(),
});

/**
 * Course Create Schema (Trainer)
 * Used for creating new courses
 */
export const courseCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  thumbnail: z.string().url("Invalid thumbnail URL").optional().nullable(),
  totalXP: z.number().int().min(0, "Total XP must be non-negative").default(0),
  isPublished: z.boolean().default(false),
});

/**
 * Training Update Schema (Trainer)
 * Used for updating training information (requires password verification)
 */
export const trainingUpdateSchema = z.object({
  password: z.string().min(1, "Password is required"),
  title: z.string().min(1, "Title is required").optional(),
  shortDescription: z.string().optional().nullable(),
  videoUrl: z
    .preprocess(
      (val) => {
        if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
          return null;
        }
        return typeof val === "string" ? val.trim() : val;
      },
      z.union([z.string().url("Invalid video URL"), z.null()])
    )
    .optional()
    .nullable(),
  videoDuration: z.number().int().min(0, "Video duration must be non-negative").optional().nullable(),
  // videoThumbnail is optional - thumbnails are uploaded via file upload
  // Accepts relative paths (e.g., /uploads/thumbnails/...) or full URLs
  videoThumbnail: z
    .preprocess(
      (val) => {
        // Convert empty strings, null, or undefined to undefined (field omitted)
        if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
          return undefined;
        }
        return typeof val === "string" ? val.trim() : val;
      },
      z
        .string()
        .refine(
          (val) => {
            // Accept relative paths (starting with /) or full URLs
            if (val.startsWith("/")) {
              return true; // Relative path is valid
            }
            // Try to validate as URL for full URLs
            try {
              new URL(val);
              return true;
            } catch {
              return false;
            }
          },
          { message: "Invalid thumbnail URL or path" }
        )
        .optional()
    )
    .optional(),
  minimumWatchTime: z.number().int().min(0, "Minimum watch time must be non-negative").optional().nullable(),
  order: z.number().int().min(0, "Order must be non-negative").optional(),
  totalXP: z.number().int().min(0, "Total XP must be non-negative").optional(),
  isPublished: z.boolean().optional(),
});

/**
 * Mini Training Create Schema (Trainer)
 * Used for creating new mini trainings
 */
export const miniTrainingCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  videoUrl: z.string().url("Invalid video URL").optional().nullable(),
  videoDuration: z.number().int().min(0, "Video duration must be non-negative").optional().nullable(),
  order: z.number().int().min(0, "Order must be non-negative").optional(),
  isRequired: z.boolean().default(true),
});

/**
 * Quiz Update Schema (Trainer)
 * Used for updating quiz information
 */
export const quizUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  passingScore: z.number().int().min(0).max(100, "Passing score must be between 0 and 100").optional(),
  timeLimit: z.number().int().min(0, "Time limit must be non-negative").optional().nullable(),
  allowRetake: z.boolean().optional(),
  maxAttempts: z.number().int().min(1, "Max attempts must be at least 1").optional().nullable(),
  questions: z.array(z.any()).optional(), // Questions array - structure validated by business logic
});

/**
 * Announcement Create Schema (Admin)
 * Used for creating new announcements
 */
export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: AnnouncementTypeEnum,
  trainerId: z.string().optional().nullable(),
  priority: z.number().int().min(0).max(100).default(0),
  expiresAt: z.string().optional().nullable(), // ISO date string
  isActive: z.boolean().default(true),
});

/**
 * Announcement Update Schema (Admin)
 * Used for updating announcements (all fields optional)
 */
export const announcementUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  type: AnnouncementTypeEnum.optional(),
  trainerId: z.string().optional().nullable(),
  priority: z.number().int().min(0).max(100).optional(),
  expiresAt: z.string().optional().nullable(), // ISO date string
  isActive: z.boolean().optional(),
});

/**
 * Theme Update Schema (Admin)
 * Used for updating theme settings (requires password verification)
 */
export const themeUpdateSchema = z.object({
  password: z.string().min(1, "Password is required"),
  primaryPurple: z.string().optional().nullable(),
  primaryIndigo: z.string().optional().nullable(),
  primaryDark: z.string().optional().nullable(),
  primaryDeep: z.string().optional().nullable(),
  accentCyan: z.string().optional().nullable(),
  accentTeal: z.string().optional().nullable(),
  starGold: z.string().optional().nullable(),
  starGoldDark: z.string().optional().nullable(),
  crystalPurple: z.string().optional().nullable(),
  crystalBright: z.string().optional().nullable(),
  bgDark: z.string().optional().nullable(),
  bgDarkSecondary: z.string().optional().nullable(),
  textPrimary: z.string().optional().nullable(),
  textSecondary: z.string().optional().nullable(),
  statusSuccess: z.string().optional().nullable(),
  statusWarning: z.string().optional().nullable(),
  statusError: z.string().optional().nullable(),
  spacingXs: z.string().optional().nullable(),
  spacingSm: z.string().optional().nullable(),
  spacingMd: z.string().optional().nullable(),
  spacingLg: z.string().optional().nullable(),
  spacingXl: z.string().optional().nullable(),
  spacing2xl: z.string().optional().nullable(),
  fontFamily: z.string().optional().nullable(),
  galaxyBackgroundEnabled: z.boolean().optional(),
  plainBackgroundColor: z.string().optional().nullable(),
});

/**
 * Approval Action Schema
 * Used for approval actions (comment is optional)
 */
export const approvalActionSchema = z.object({
  comment: z.string().optional().nullable(),
});

/**
 * Rejection Action Schema
 * Used for reject actions (reason is required)
 */
export const rejectionActionSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
});

