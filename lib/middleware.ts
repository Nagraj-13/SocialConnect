// middleware.ts
import { updateSession } from "./supabase/middleware";
import type { NextRequest } from "next/server";
export const runtime = "nodejs"; 

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

