import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  const { pathname } = request.nextUrl;

  // If no session cookie, redirect to login
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role checking is handled server-side in the route handlers / pages
  // Middleware only ensures the user is authenticated
  return NextResponse.next();
}

export const config = {
  matcher: ["/teacher/:path*", "/admin/:path*"],
};
