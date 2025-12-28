import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      avatar: string | null;
      role: "SUPER_ADMIN" | "ADMIN" | "REGIONAL_MANAGER" | "AREA_MANAGER" | "BRANCH_MANAGER" | "EMPLOYEE" | "TRAINER";
      employeeNumber: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    role: "SUPER_ADMIN" | "ADMIN" | "BRANCH_MANAGER" | "EMPLOYEE";
    employeeNumber?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    role: "SUPER_ADMIN" | "ADMIN" | "BRANCH_MANAGER" | "EMPLOYEE";
    employeeNumber?: string | null;
  }
}

