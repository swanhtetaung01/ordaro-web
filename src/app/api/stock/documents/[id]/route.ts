import { proxy } from "@/lib/backend";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxy(`/stock-documents/${id}`);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const action = new URL(request.url).searchParams.get("action");
  if (action === "void") {
    return proxy(`/stock-documents/${id}/void`, { method: "POST" });
  }
  return proxy(`/stock-documents/${id}/post`, { method: "POST" });
}
