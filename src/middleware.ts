import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/factures", "/clients", "/prestations", "/profil-vendeur"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) {
    return NextResponse.next();
  }
  /**
   * We deliberately avoid cookie-based auth gating in middleware.
   *
   * The app uses a client-managed access token (localStorage) and handles 401
   * centrally (redirect + clear session). Relying on a non-HttpOnly cookie here
   * can cause false negatives during client-side navigations (leading to an
   * immediate redirect loop back to /login).
   */
  return NextResponse.next();
}

export const config = {
  matcher: ["/factures/:path*", "/clients/:path*", "/prestations/:path*", "/profil-vendeur/:path*"],
};
