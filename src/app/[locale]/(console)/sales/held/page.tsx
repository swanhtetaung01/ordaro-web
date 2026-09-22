import { setRequestLocale } from "next-intl/server";

import { HeldSales } from "@/components/held-sales";

export default async function HeldSalesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HeldSales />;
}
