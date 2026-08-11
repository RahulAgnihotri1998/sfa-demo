import { NextResponse, type NextRequest } from "next/server";

// Role-based route protection completely offline.
// - /rep/**     -> sales_rep only
// - /manager/** -> manager (and admin) only
// - everything else (login, api) passes through
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/rep") || path.startsWith("/manager");

  const userId = request.cookies.get("sfa-session-user-id")?.value;
  const role = request.cookies.get("sfa-session-user-role")?.value;

  if (isProtected && !userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (userId && isProtected) {
    if (path.startsWith("/rep") && role !== "sales_rep") {
      return NextResponse.redirect(new URL("/manager/dashboard", request.url));
    }
    if (path.startsWith("/manager") && role !== "manager" && role !== "admin") {
      return NextResponse.redirect(new URL("/rep/home", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/rep/:path*", "/manager/:path*"],
};
