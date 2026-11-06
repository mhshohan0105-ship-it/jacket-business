import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, isValidSession } from "@/lib/auth";

// Every page and server action needs a login, on local and on Vercel alike.
export function proxy(request: NextRequest) {
  const loggedIn = isValidSession(request.cookies.get(AUTH_COOKIE)?.value);
  const onLoginPage = request.nextUrl.pathname === "/login";

  if (loggedIn && onLoginPage) return NextResponse.redirect(new URL("/", request.url));
  if (loggedIn || onLoginPage) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
