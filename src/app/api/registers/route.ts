import { proxy } from "@/lib/backend";

export async function GET() {
  return proxy("/registers");
}

export async function POST(request: Request) {
  return proxy("/registers", { method: "POST", body: await request.json() });
}
