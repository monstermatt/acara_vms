import next from "next";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextRequest } from "next/server";

//helper function
function decodeJwt(token: string) {
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) return { exp: 0 };
  const encodedPayload = tokenParts[1];
  return JSON.parse(Buffer.from(encodedPayload, 'base64').toString('utf-8'));
}

// refreshAccessToken
async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/token/refresh/`, {
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
    };
  } catch (error) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minute time out
    updateAge: 5 * 60, // extend session every 5 minutes of activity
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/token/`, {
          method: 'POST',
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
          headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();
        console.log("Django response:", data) // for debugging on successful login

        if (res.ok && data.access) {
          const decodedPayload = decodeJwt(data.access);

          return {
            id: decodedPayload.user_id.toString(),
            email: decodedPayload.email,
            role: decodedPayload.role,
            access: data.access,
            refresh: data.refresh,
          };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial Sign in
      if (user) {
        const accessData = decodeJwt((user as any).access);
        return {
          ...token,
          accessToken: (user as any).access,
          refreshToken: (user as any).refresh,
          role: (user as any).role, 
          id: user.id,              
          expiresAt: accessData.exp * 1000,
        };
      }

      // Return previous token if the access token has not expired yet w/ 10 second buffer
      if (Date.now() < (token as any).expiresAt - 10000) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', 
    newUser: ''
  }
};

// Pass the options into NextAuth
const handler = NextAuth(authOptions);

// Intercept the POST request to prevent NextAuth from running JSON.parse on form data
export async function POST(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  const clonedReq = req.clone();
  
  // If the request is mistakenly flagged as JSON, intercept and fix the header
  if (clonedReq.headers.get("content-type")?.includes("application/json")) {
     const text = await clonedReq.text();
     
     // Rebuild the request with the correct Content-Type so NextAuth parses it as URL-encoded
     const newReq = new Request(clonedReq.url, {
         method: 'POST',
         headers: {
             ...Object.fromEntries(clonedReq.headers),
             "content-type": "application/x-www-form-urlencoded",
         },
         body: text
     });

     const nextReq = new NextRequest(newReq);

     return (handler as any)(nextReq, ctx);
  }

  return (handler as any)(req, ctx);
}

export { handler as GET };