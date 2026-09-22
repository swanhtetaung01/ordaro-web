import { setRequestLocale } from "next-intl/server";

import { SaleDesk } from "@/components/sale-desk";

export default async function NewSalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SaleDesk />;
}
