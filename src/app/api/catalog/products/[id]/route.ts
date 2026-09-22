import { relay, api } from "@/lib/relay";
import type { Schemas } from "@/lib/backend";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  return relay((token) => api(token).GET("/products/{id}", { params: { path: { id } } }));
}

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = (await request.json()) as Schemas["ProductWrite"];
  return relay((token) => api(token).PATCH("/products/{id}", { params: { path: { id } }, body }));
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  return relay((token) => api(token).DELETE("/products/{id}", { params: { path: { id } } }));
}
