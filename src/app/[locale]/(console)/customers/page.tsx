import { setRequestLocale } from "next-intl/server";

import { CustomerDesk } from "@/components/customer-desk";

export default async function CustomersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CustomerDesk />;
}
