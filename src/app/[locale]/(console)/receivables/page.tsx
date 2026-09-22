import { setRequestLocale } from "next-intl/server";

import { ReceivableDesk } from "@/components/receivable-desk";

export default async function ReceivablesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ReceivableDesk />;
}
