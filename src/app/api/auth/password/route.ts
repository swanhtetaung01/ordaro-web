import { api, errorResponse, withAccess, writeTokens } from "@/lib/backend";
import type { Tokens } from "@/lib/backend";

/** Change your own password. The backend ends every other session and hands this one new tokens. */
export async function POST(request: Request) {
  const body = (await request.json()) as { currentPassword?: string; newPassword?: string };
  const changed = await withAccess((token) =>
    api(token).POST("/auth/password", {
      body: {
        currentPassword: body.currentPassword ?? "",
        newPassword: body.newPassword ?? "",
        deviceLabel: "trillopos-web",
      },
    }),
  );
  if (!changed.response.ok || !changed.data) {
    const problem = (changed.error ?? {}) as { code?: string; detail?: string };
    return errorResponse(changed.response.status || 502, { code: problem.code ?? "unknown", detail: problem.detail });
  }
  await writeTokens(changed.data as Tokens);
  return new Response(null, { status: 204 });
}
