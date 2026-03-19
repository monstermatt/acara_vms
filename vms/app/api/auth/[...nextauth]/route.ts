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

        if (res.ok && data.access) {
          return {
            id: "user-id-from-token", //nextauth wants an ID to attach keys to
            email: credentials?.email,
            ...data
          };
        }
        return null;

        console.log("Django Response:", data)
        console.log(credentials)
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.access;
        token.refreshToken = user.refresh;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    }
  },
  pages: {
    signIn: '/login', // Path login page
  }
});

export { handler as GET, handler as POST }; //NextAuth expects each method as a separate export.