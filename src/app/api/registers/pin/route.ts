import { errorResponse, writeTokens } from "@/lib/backend";
import type { Tokens } from "@/lib/backend";

export async function POST(request: Request) {
  const body = (await request.json()) as { deviceCredential?: string; membershipId?: string; pin?: string };
  const response = await fetch(`${process.env.TRILLOPOS_API_URL ?? "http://localhost:8080"}/auth/pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Register-Device": body.deviceCredential ?? "",
    },
    body: JSON.stringify({ membershipId: body.membershipId, pin: body.pin }),
  });
  const payload = (await response.json().catch(() => ({}))) as Tokens & { code?: string };
  if (!response.ok || !payload.accessToken) {
    return errorResponse(response.status, { code: payload.code ?? "unknown" });
  }
  await writeTokens(payload);
  return Response.json({ kind: payload.kind });
}
