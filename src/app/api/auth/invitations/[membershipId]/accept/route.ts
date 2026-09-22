import { api, errorResponse, withAccess } from "@/lib/backend";
import type { Membership } from "@/lib/backend";

export async function POST(_request: Request, context: { params: Promise<{ membershipId: string }> }) {
  const { membershipId } = await context.params;
  const accepted = await withAccess((token) =>
    api(token).POST("/auth/invitations/{membershipId}/accept", {
      params: { path: { membershipId } },
    }),
  );
  if (!accepted.response.ok || !accepted.data) {
    const code =
      accepted.error && typeof accepted.error === "object" && "code" in accepted.error
        ? String((accepted.error as { code?: string }).code)
        : "unknown";
    return errorResponse(accepted.response.status, { code });
  }
  return Response.json(accepted.data as Membership);
}
