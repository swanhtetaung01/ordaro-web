import { proxy } from "@/lib/backend";

export async function PATCH(request: Request) {
  return proxy("/organization", { method: "PATCH", body: await request.json() });
}
