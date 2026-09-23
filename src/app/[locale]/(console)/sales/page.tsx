import { setRequestLocale } from "next-intl/server";

import { SalesLog } from "@/components/sales-log";

export default async function SalesLogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SalesLog />;
}
