import { setRequestLocale } from "next-intl/server";

import { SupplierManager } from "@/components/supplier-manager";

export default async function SuppliersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SupplierManager />;
}
