import { relay, api } from "@/lib/relay";
import type { Schemas } from "@/lib/backend";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as Schemas["CategoryUpdate"];
  return relay((token) => api(token).PATCH("/categories/{id}", { params: { path: { id } }, body }));
}
