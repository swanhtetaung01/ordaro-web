import { NextResponse } from "next/server";

import { api, clearTokens, withAccess } from "@/lib/backend";

/** Refreshes the session where cookie writes are allowed, then sends the browser on. */
export async function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get("locale") || "en";
  const session = await withAccess((token) => api(token).GET("/auth/memberships"));
  if (!session.response.ok) {
    await clearTokens();
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
  return NextResponse.redirect(new URL(`/${locale}/products`, request.url));
}
