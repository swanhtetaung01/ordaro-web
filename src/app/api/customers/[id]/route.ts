import { proxy } from "@/lib/backend";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxy(`/customers/${id}`);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxy(`/customers/${id}`, { method: "PATCH", body: await request.json() });
}
