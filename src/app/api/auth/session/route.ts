import { accessToken, api, tokenKind, withAccess } from "@/lib/backend";
import type { Membership } from "@/lib/backend";

export async function GET() {
  const listed = await withAccess((token) => api(token).GET("/auth/memberships"));
  if (!listed.response.ok) {
    return Response.json({ authenticated: false as const, memberships: [] as Membership[] });
  }
  return Response.json({
    authenticated: true as const,
    kind: tokenKind(await accessToken()),
    memberships: (listed.data ?? []) as Membership[],
  });
}
