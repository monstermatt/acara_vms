import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Send credentials to Django, replace with real end point in production if necessary.
        const res = await fetch("http://127.0.0.1:8000/api/token/", {
          method: 'POST',
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
          headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();
        console.log("Django response:", data) //for debugging on successful lgoin

        if (res.ok && data.access) {
          const tokenParts = data.access.split('.');
          const encodedPayload = tokenParts[1];
          const decodedPayload = JSON.parse(Buffer.from(encodedPayload,'base64').toString('utf-8'));

          console.log("decoded JSON:", decodedPayload) //debug role

          return {
            id: decodedPayload.user_id.toString(),
            email: decodedPayload.email,
            role: decodedPayload.role,
            access: data.access,
            refresh: data.refresh,
          };
        }
        console.log("Django Response:", data) //debugging on failure
        console.log(credentials)
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.access;
        token.refreshToken = user.refresh;
        token.role = user.role; //pass role to nextauth
        token.id = user .id;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.role = token.role;
      session.user.id = token.id;
      return session;
    }
  },
  pages: {
    signIn: '/login', // Path login page
  }
});

export { handler as GET, handler as POST }; //NextAuth expects each method as a separate export.
