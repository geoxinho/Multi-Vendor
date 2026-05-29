import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLE_HOME: Record<string, string> = {
  buyer: "/dashboard/buyer",
  seller: "/dashboard/seller",
  admin: "/dashboard/admin",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  // Protect all dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    const role = token.role as string;
    const correctBase = ROLE_HOME[role];

    // Redirect wrong-role access
    if (!pathname.startsWith(correctBase)) {
      return NextResponse.redirect(new URL(correctBase, req.url));
    }
  }

  // Protect checkout
  if (pathname.startsWith("/checkout")) {
    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/login?callbackUrl=/checkout", req.url)
      );
    }
    if (token.role !== "buyer") {
      return NextResponse.redirect(
        new URL(ROLE_HOME[token.role as string], req.url)
      );
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname.startsWith("/auth/") && token) {
    return NextResponse.redirect(
      new URL(ROLE_HOME[token.role as string], req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/checkout/:path*", "/auth/:path*"],
};
