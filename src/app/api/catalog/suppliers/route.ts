import { proxy } from "@/lib/backend";

export async function GET() {
  return proxy("/suppliers");
}

export async function POST(request: Request) {
  return proxy("/suppliers", { method: "POST", body: await request.json() });
}
