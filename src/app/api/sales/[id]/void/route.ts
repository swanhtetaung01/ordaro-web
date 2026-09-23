import { proxy } from "@/lib/backend";

/** Throw away a held cart. A completed sale is undone by a return, never a void. */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxy(`/sales/${id}/void`, { method: "POST" });
}
