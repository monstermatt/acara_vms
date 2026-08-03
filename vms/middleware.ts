import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        console.log(req.nextUrl.pathname);
        console.log(req.nextauth.token);
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                if (!token) return false; //automatically reject req w/o token

                const path = req.nextUrl.pathname;
                const userRole = token.role;

                if (path.startsWith("/settings")) { //prevents non-admins fromaccessing settings, this is mostly for testing. comment this IF out to access the page without ADMIN role
                    return userRole === "ADMIN";
                }

                if (path.startsWith("/volunteers") || path.startsWith("/dashboard") || path.startsWith("/calendar")) {
                    return userRole === "COORD" || userRole === "ADMIN";
                }
                if (path.startsWith("/profile")) {
                    return userRole === "VOLUN" || userRole === "COORD" || userRole === "ADMIN";
                }

                return true; //allow unprotected routes to be accessed
            }
        }
    }
)
//list of routes to put behind authentication, in case we ever want to have /training or something publicly availble.
export const config = {
    matcher: [
        "/dashboard/:path*",
        "/settings/:path*",
        "/volunteers/:path*",
        "/calendar/:path*",
        "/profile/:path*"
    ]
}
