import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { UserRole } from "@/types/next-auth";

interface DecodedAccessJwt {
  exp: number;
  user_id?: number | string;
  email?: string;
  role?: UserRole;
}

const BACKEND_BASE_URL =
  process.env.NEXTAUTH_BACKEND_URL || process.env.NEXT_PUBLIC_BASE_URL;

/**
 * Safely decodes a JWT payload using Base64URL encoding.
 */
function decodeJwt(token: string): DecodedAccessJwt {
  try {
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) return { exp: 0 };
    const decoded = Buffer.from(tokenParts[1], "base64url").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return { exp: 0 };
  }
}

// Deduplicate concurrent refresh requests for the same refresh token
const inFlightRefreshes = new Map<string, Promise<JWT>>();

async function performRefreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: token.refreshToken }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access,
      expiresAt: decodeJwt(refreshedTokens.access).exp * 1000,
      refreshToken: refreshedTokens.refresh ?? token.refreshToken,
      error: undefined,
    };
  } catch {
    // Surfaced to the client via the session callback so SessionKeepAlive can sign the user out cleanly
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  const key = token.refreshToken;
  if (!key) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  const existing = inFlightRefreshes.get(key);
  if (existing) {
    return existing;
  }

  const refreshPromise = performRefreshAccessToken(token).finally(() => {
    inFlightRefreshes.delete(key);
  });

  inFlightRefreshes.set(key, refreshPromise);
  return refreshPromise;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // 30 minute idle timeout. SessionKeepAlive hits /api/auth/session while the user is active.
    maxAge: 30 * 60,
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const res = await fetch(`${BACKEND_BASE_URL}/api/token/`, {
          method: "POST",
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json().catch(() => null);

        if (res.ok && data?.access) {
          const decodedPayload = decodeJwt(data.access);
          if (!decodedPayload.user_id || !decodedPayload.role) {
            return null;
          }

          return {
            id: decodedPayload.user_id.toString(),
            email: decodedPayload.email ?? credentials.email,
            role: decodedPayload.role,
            access: data.access,
            refresh: data.refresh,
            expiresAt: decodedPayload.exp * 1000,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in
      if (user) {
        return {
          ...token,
          accessToken: user.access,
          refreshToken: user.refresh,
          role: user.role,
          id: user.id,
          expiresAt: user.expiresAt,
        };
      }

      // Return previous token if the access token has not expired yet (with 60s buffer)
      if (Date.now() < token.expiresAt - 60_000) {
        return token;
      }

      // Access token has expired, refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
