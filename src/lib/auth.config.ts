import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // we will add credentials in auth.ts
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "";
        token.roles = (user as { roles?: string[] }).roles ?? [
          token.role as string,
        ];
        token.storeName = (user as { storeName?: string }).storeName ?? "";
        token.school = (user as { school?: string }).school ?? "";
      }
      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        if (session.roles) token.roles = session.roles;
        if (session.storeName !== undefined) token.storeName = session.storeName;
        if (session.school !== undefined) token.school = session.school;
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
        session.user.storeName = (token.storeName as string) ?? "";
        session.user.school = (token.school as string) ?? "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
} satisfies NextAuthConfig;
