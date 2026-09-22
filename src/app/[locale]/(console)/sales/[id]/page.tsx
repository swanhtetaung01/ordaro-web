import { setRequestLocale } from "next-intl/server";

import { SaleReceipt } from "@/components/sale-receipt";

export default async function SalePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <SaleReceipt saleId={id} />;
}
