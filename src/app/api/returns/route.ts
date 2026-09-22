import { proxy } from "@/lib/backend";

export async function POST(request: Request) {
  return proxy("/returns", { method: "POST", body: await request.json() });
}
