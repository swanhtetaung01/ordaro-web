import { proxy } from "@/lib/backend";

export async function GET() {
  return proxy("/expenses/categories");
}

export async function POST(request: Request) {
  return proxy("/expenses/categories", { method: "POST", body: await request.json() });
}
