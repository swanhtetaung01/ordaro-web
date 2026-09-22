import { proxy } from "@/lib/backend";

export async function GET() {
  return proxy("/locations");
}

export async function POST(request: Request) {
  return proxy("/locations", { method: "POST", body: await request.json() });
}
