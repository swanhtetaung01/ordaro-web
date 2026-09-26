import { errorResponse, publicCall, api, writeTokens } from "@/lib/backend";
import type { Schemas } from "@/lib/backend";

export async function POST(request: Request) {
  const body = (await request.json()) as { phone?: string; password?: string };
  const result = await publicCall<Schemas["LoginResult"]>(() =>
    api().POST("/auth/login", {
      body: { phone: body.phone ?? "", password: body.password ?? "", deviceLabel: "trillopos-web" },
    }),
  );
  if (!result.ok || !result.data?.tokens) {
    return errorResponse(result.ok ? 502 : result.status, result.ok ? { code: "unknown" } : result.problem);
  }
  await writeTokens(result.data.tokens);
  return Response.json({
    kind: result.data.tokens.kind,
    memberships: result.data.memberships ?? [],
  });
}
