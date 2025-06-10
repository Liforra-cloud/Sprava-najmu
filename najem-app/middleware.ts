// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  // obnoví session a cookies (stačí takto, nemusíš nic dál kontrolovat)
  await supabase.auth.getSession();
  return res;
}

// Platí na všechny stránky kromě _next, favicon atd.
export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
