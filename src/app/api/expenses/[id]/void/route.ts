import { proxy } from "@/lib/backend";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxy(`/expenses/${id}/void`, { method: "POST" });
}
