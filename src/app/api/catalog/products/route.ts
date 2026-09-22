import { relay, api } from "@/lib/relay";
import type { Schemas } from "@/lib/backend";

export async function GET() {
  return relay((token) => api(token).GET("/products"));
}

export async function POST(request: Request) {
  const body = (await request.json()) as Schemas["ProductWrite"];
  return relay((token) => api(token).POST("/products", { body }));
}
