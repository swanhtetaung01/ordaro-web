import { relay, api } from "@/lib/relay";
import type { Schemas } from "@/lib/backend";

export async function GET() {
  return relay((token) => api(token).GET("/categories"));
}

export async function POST(request: Request) {
  const body = (await request.json()) as Schemas["CategoryCreate"];
  return relay((token) => api(token).POST("/categories", { body }));
}
