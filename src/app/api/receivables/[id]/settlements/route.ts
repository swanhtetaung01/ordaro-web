import { proxy } from "@/lib/backend";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxy(`/receivables/${id}/settlements`, { method: "POST", body: await request.json() });
}
