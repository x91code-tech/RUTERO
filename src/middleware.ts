import { NextResponse, type NextRequest } from "next/server";

const sessionCookieName = "rutero_session";
const authRoutes = ["/login", "/register"];
const protectedPrefixes = [
  "/cashbox",
  "/clients",
  "/collections",
  "/dashboard",
  "/expenses",
  "/inventory",
  "/loans",
  "/notifications",
  "/reports",
  "/routes",
  "/sales",
  "/seller",
  "/settings"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-rutero-pathname", pathname);
  const hasSession = Boolean(request.cookies.get(sessionCookieName)?.value);
  const isAuthRoute = authRoutes.some((route) => pathname === route);
  const isProtectedRoute = protectedPrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|icon.svg|manifest.webmanifest|sw.js|offline).*)"]
};
