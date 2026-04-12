import next from "next";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {NextRequest} from "next/server";


export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const res = await fetch("http://127.0.0.1:8000/api/token/", {
          method: 'POST',
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
          headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();
        console.log("Django response:", data) //for debugging on successful login

        if (res.ok && data.access) {
          const tokenParts = data.access.split('.');
          const encodedPayload = tokenParts[1];
          const decodedPayload = JSON.parse(Buffer.from(encodedPayload,'base64').toString('utf-8'));

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
      if (user) {
        token.accessToken = (user as any).access;
        token.refreshToken = (user as any).refresh;
        token.role = (user as any).role; 
        token.id = user.id;
      }
      return token;
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

//Pass the options into NextAuth
const handler = NextAuth(authOptions);
// Intercept the POST request to prevent NextAuth from running JSON.parse on form data
export async function POST(req: Request, ctx: { params: { nextauth: string[] } }) {
  const clonedReq = req.clone();
  
  // If the request is mistakenly flagged as JSON, we intercept and fix the header
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

     return handler(nextReq, ctx);
  }

  return handler(req, ctx);
}

export { handler as GET, };

