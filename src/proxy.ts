import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLE_HOME: Record<string, string> = {
  buyer: "/",
  seller: "/dashboard/seller",
  admin: "/dashboard/admin",
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  // ── /admin login page ─────────────────────────────────────────────────────
  // If already logged in as admin, skip the login page and go to dashboard
  if (pathname === "/admin") {
    if (token && token.role === "admin") {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }
    // Non-admins who are logged in should be bounced away
    if (token && token.role !== "admin") {
      return NextResponse.redirect(new URL(ROLE_HOME[token.role as string] ?? "/", req.url));
    }
    // Not logged in — allow access to the admin login form
    return NextResponse.next();
  }

  // ── Protect /dashboard/admin — only accessible to admins ─────────────────
  if (pathname.startsWith("/dashboard/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (token.role !== "admin") {
      return NextResponse.redirect(new URL(ROLE_HOME[token.role as string] ?? "/", req.url));
    }
  }

  // ── Protect all other dashboard routes ───────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    const role = token.role as string;
    const correctBase = ROLE_HOME[role];

    // Redirect wrong-role access (except admin is handled above)
    if (role !== "admin" && correctBase && !pathname.startsWith(correctBase)) {
      return NextResponse.redirect(new URL(correctBase, req.url));
    }
  }

  // ── Protect checkout ──────────────────────────────────────────────────────
  if (pathname.startsWith("/checkout")) {
    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/login?callbackUrl=/checkout", req.url)
      );
    }
    if (token.role !== "buyer") {
      return NextResponse.redirect(
        new URL(ROLE_HOME[token.role as string] ?? "/", req.url)
      );
    }
  }

  // ── Redirect logged-in users away from auth pages ────────────────────────
  if (pathname.startsWith("/auth/") && token) {
    return NextResponse.redirect(
      new URL(ROLE_HOME[token.role as string] ?? "/", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/dashboard/:path*", "/checkout/:path*", "/auth/:path*"],
};
