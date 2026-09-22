import { api, errorResponse, withAccess } from "@/lib/backend";

export async function relay(
  run: (token: string | undefined) => Promise<{ data?: unknown; error?: unknown; response: Response }>,
) {
  const result = await withAccess(run);
  if (!result.response.ok) {
    const body = result.error;
    const code =
      body && typeof body === "object" && "code" in body
        ? String((body as { code?: string }).code ?? "unknown")
        : "unknown";
    return errorResponse(result.response.status || 502, { code });
  }
  if (result.response.status === 204) {
    return new Response(null, { status: 204 });
  }
  return Response.json(result.data ?? null, { status: result.response.status });
}

export { api };
