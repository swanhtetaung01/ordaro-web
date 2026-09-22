import { proxy } from "@/lib/backend";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxy(`/locations/${id}`, { method: "PATCH", body: await request.json() });
}
