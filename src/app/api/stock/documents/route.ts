import { proxy } from "@/lib/backend";

export async function GET() {
  return proxy("/stock-documents");
}

export async function POST(request: Request) {
  return proxy("/stock-documents", { method: "POST", body: await request.json() });
}
