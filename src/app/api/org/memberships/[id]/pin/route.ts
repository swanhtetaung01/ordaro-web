import { proxy } from "@/lib/backend";

/** Set or reset someone's 6-digit register PIN (owners only; the API enforces it). */
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxy(`/memberships/${id}/pin`, { method: "PUT", body: await request.json() });
}
