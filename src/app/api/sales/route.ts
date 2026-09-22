import { proxy } from "@/lib/backend";

export async function POST(request: Request) {
  return proxy("/sales", { method: "POST", body: await request.json() });
}
