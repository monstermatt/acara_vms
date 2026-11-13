import "next-auth";
import "next-auth/jwt";

export type UserRole = "ADMIN" | "COORD" | "VOLUN";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: UserRole;
    access: string;
    refresh: string;
    expiresAt: number;
  }

  interface Session {
    accessToken?: string;
    error?: "RefreshAccessTokenError";
    user: {
      id: string;
      email: string;
      role: UserRole;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    error?: "RefreshAccessTokenError";
  }
}
