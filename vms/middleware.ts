import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@/types/next-auth";

const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/settings": ["ADMIN"],
  "/volunteers": ["COORD", "ADMIN"],
  "/dashboard": ["COORD", "ADMIN"],
  "/calendar": ["COORD", "ADMIN"],
  "/profile": ["VOLUN", "COORD", "ADMIN"],
};

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (!token || token.error === "RefreshAccessTokenError") {
          return false;
        }

        const path = req.nextUrl.pathname;
        const userRole = token.role;

        for (const [routePrefix, allowedRoles] of Object.entries(ROUTE_ROLES)) {
          if (path.startsWith(routePrefix)) {
            return allowedRoles.includes(userRole);
          }
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/volunteers/:path*",
    "/calendar/:path*",
    "/profile/:path*",
  ],
};
