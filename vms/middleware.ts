export { default } from "next-auth/middleware"

//list of routes to put behind authentication, in case we ever want to have /training or something publicly availble.
export const config = {
    matcher: ["/dashboard/:path*"]
}