import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// Dashboard home per role
const ROLE_DASHBOARD: Record<string, string> = {
  buyer: "/dashboard/buyer",
  seller: "/dashboard/seller",
  admin: "/dashboard/admin",
};

// After login redirect (buyers go to homepage)
const ROLE_HOME: Record<string, string> = {
  buyer: "/",
  seller: "/dashboard/seller",
  admin: "/dashboard/admin",
};

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const token = req.auth?.user;

  // ── /mystartup login page ──────────────────────────────────────────────────
  if (pathname === "/mystartup") {
    if (token?.role === "admin")
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    if (token && token.role !== "admin")
      return NextResponse.redirect(
        new URL(ROLE_HOME[token.role as string] ?? "/", req.url)
      );
    return NextResponse.next();
  }

  // ── Protect /dashboard/admin ───────────────────────────────────────────────
  if (pathname.startsWith("/dashboard/admin")) {
    if (!token)
      return NextResponse.redirect(new URL("/mystartup", req.url));
    if (token.role !== "admin")
      return NextResponse.redirect(
        new URL(ROLE_HOME[token.role as string] ?? "/", req.url)
      );
    return NextResponse.next();
  }

  // ── Protect /dashboard/seller ──────────────────────────────────────────────
  if (pathname.startsWith("/dashboard/seller")) {
    if (!token)
      return NextResponse.redirect(
        new URL("/auth/login?callbackUrl=" + encodeURIComponent(pathname), req.url)
      );
    if (token.role !== "seller")
      return NextResponse.redirect(
        new URL(ROLE_DASHBOARD[token.role as string] ?? "/", req.url)
      );
    return NextResponse.next();
  }

  // ── Protect /dashboard/buyer ───────────────────────────────────────────────
  if (pathname.startsWith("/dashboard/buyer")) {
    if (!token)
      return NextResponse.redirect(
        new URL("/auth/login?callbackUrl=" + encodeURIComponent(pathname), req.url)
      );
    if (token.role !== "buyer")
      return NextResponse.redirect(
        new URL(ROLE_DASHBOARD[token.role as string] ?? "/", req.url)
      );
    return NextResponse.next();
  }

  // ── Protect checkout ──────────────────────────────────────────────────────
  if (pathname.startsWith("/checkout")) {
    if (!token)
      return NextResponse.redirect(
        new URL("/auth/login?callbackUrl=/checkout", req.url)
      );
    if (token.role !== "buyer")
      return NextResponse.redirect(
        new URL(ROLE_DASHBOARD[token.role as string] ?? "/", req.url)
      );
    return NextResponse.next();
  }

  // ── Redirect logged-in users away from auth pages ─────────────────────────
  if (pathname.startsWith("/auth/") && token) {
    return NextResponse.redirect(
      new URL(ROLE_HOME[token.role as string] ?? "/", req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/mystartup",
    "/dashboard/:path*",
    "/checkout/:path*",
    "/auth/:path*",
  ],
};
