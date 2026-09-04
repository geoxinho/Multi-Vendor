import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "e27427393f0bfe4ab8dd910965350cd03154bc905b7ca923ea057b90db1c5d44",
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
        token.campusSlug = (user as { campusSlug?: string }).campusSlug ?? "";
        token.passport = (user as { passport?: string }).passport ?? "";
        token.avatar = (user as { avatar?: string }).avatar ?? "";
        token.image = (user as { image?: string }).image ?? "";
      }
      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        if (session.roles) token.roles = session.roles;
        if (session.storeName !== undefined) token.storeName = session.storeName;
        if (session.school !== undefined) token.school = session.school;
        if (session.campusSlug !== undefined) token.campusSlug = session.campusSlug;
        if (session.passport !== undefined) token.passport = session.passport;
        if (session.avatar !== undefined) token.avatar = session.avatar;
        if (session.image !== undefined) token.image = session.image;
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
        session.user.campusSlug = (token.campusSlug as string) ?? "";
        session.user.passport = (token.passport as string) ?? "";
        session.user.avatar = (token.avatar as string) ?? "";
        session.user.image = (token.image as string) ?? "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
} satisfies NextAuthConfig;
