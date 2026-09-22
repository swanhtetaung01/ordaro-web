import { setRequestLocale } from "next-intl/server";

import { StockDesk } from "@/components/stock-desk";

export default async function StockPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StockDesk />;
}
