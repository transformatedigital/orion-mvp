import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuth = request.cookies.get("orion_auth")?.value === "true";
  const path = request.nextUrl.pathname;
  const isLoginPage = path === "/login";

  // Si no está autenticado y no está en login → redirigir a login
  if (!isAuth && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Si ya está autenticado y va a login → redirigir a dashboard
  if (isAuth && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
