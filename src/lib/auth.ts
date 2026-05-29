import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

import { CredentialsSignin } from "next-auth";

class CustomAuthError extends CredentialsSignin {
  code: string;
  constructor(message: string) {
    super();
    this.code = message;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const emailToFind = (credentials.email as string).toLowerCase().trim();
        const user = await User.findOne({ email: emailToFind }).lean();

        if (!user) throw new CustomAuthError("No account found with this email address.");
        if (user.isBanned) throw new CustomAuthError("Your account has been banned.");
        if (!user.isEmailVerified) throw new CustomAuthError("Please verify your email address before logging in.");

        const isMatch = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );
        if (!isMatch) throw new CustomAuthError("Incorrect password. Please try again.");

        // Ensure roles array is populated (backward compat with old accounts)
        const roles: string[] =
          user.roles && user.roles.length > 0
            ? (user.roles as string[])
            : [user.role as string];

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as string,
          roles,
          image: user.avatar,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "";
        token.roles = (user as { roles?: string[] }).roles ?? [
          token.role as string,
        ];
      }
      // session.update({ role, roles }) called from client
      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        if (session.roles) token.roles = session.roles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.roles = (token.roles as string[]) ?? [
          token.role as string,
        ];
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
});
