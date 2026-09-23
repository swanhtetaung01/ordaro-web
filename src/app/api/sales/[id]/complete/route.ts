import { proxy } from "@/lib/backend";

/** Charge a held cart: { idempotencyKey, payments }. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxy(`/sales/${id}/complete`, { method: "POST", body: await request.json() });
}
