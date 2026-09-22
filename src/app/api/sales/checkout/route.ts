import { proxy } from "@/lib/backend";

export async function POST(request: Request) {
  return proxy("/sales/checkout", { method: "POST", body: await request.json() });
}
