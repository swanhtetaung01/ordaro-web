import { proxy } from "@/lib/backend";

export async function GET() {
  return proxy("/memberships");
}

export async function POST(request: Request) {
  return proxy("/memberships", { method: "POST", body: await request.json() });
}
