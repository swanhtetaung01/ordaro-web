import { proxy } from "@/lib/backend";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.toString();
  return proxy(`/expenses${query ? `?${query}` : ""}`);
}

export async function POST(request: Request) {
  return proxy("/expenses", { method: "POST", body: await request.json() });
}
