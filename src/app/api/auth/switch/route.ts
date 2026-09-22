import { api, errorResponse, withAccess, writeTokens } from "@/lib/backend";
import type { Tokens } from "@/lib/backend";

export async function POST(request: Request) {
  const body = (await request.json()) as { organizationId?: string };
  const switched = await withAccess((token) =>
    api(token).POST("/auth/switch", {
      body: { organizationId: body.organizationId ?? "", deviceLabel: "ordaro-web" },
    }),
  );
  if (!switched.response.ok || !switched.data) {
    const code =
      switched.error && typeof switched.error === "object" && "code" in switched.error
        ? String((switched.error as { code?: string }).code)
        : "unknown";
    return errorResponse(switched.response.status, { code });
  }
  await writeTokens(switched.data as Tokens);
  return Response.json({ kind: (switched.data as Tokens).kind });
}
