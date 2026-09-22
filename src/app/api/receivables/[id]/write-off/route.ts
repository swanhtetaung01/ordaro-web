import { proxy } from "@/lib/backend";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const text = await request.text();
  return proxy(`/receivables/${id}/write-off`, { method: "POST", body: text ? JSON.parse(text) : {} });
}
